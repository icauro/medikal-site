import json
import os
import sys
import time
from collections import defaultdict
from datetime import datetime

try:
    import firebase_admin
    from firebase_admin import credentials, firestore
except ImportError:
    print("ERROR: firebase-admin package is not installed")
    print("Install it with: pip install firebase-admin")
    sys.exit(1)

# Firebase project configuration
PROJECT_ID = "mpturkey-ccd57"
SERVICE_ACCOUNT_KEY = "serviceAccountKey.json"

def initialize_firebase():
    """Initialize Firebase Admin SDK."""
    print(f"\n📋 Checking for service account key: {SERVICE_ACCOUNT_KEY}")
    
    if not os.path.exists(SERVICE_ACCOUNT_KEY):
        print(f"❌ ERROR: {SERVICE_ACCOUNT_KEY} not found!")
        print("\nTo get your service account key:")
        print("1. Go to Firebase Console: https://console.firebase.google.com")
        print("2. Select your project (mpturkey-ccd57)")
        print("3. Click Settings (gear icon) → Project Settings")
        print("4. Go to 'Service Accounts' tab")
        print("5. Click 'Generate New Private Key'")
        print("6. Save the downloaded JSON file as 'serviceAccountKey.json' in this directory")
        sys.exit(1)

    print(f"✓ Service account key found!")
    
    try:
        # Load and display service account details
        with open(SERVICE_ACCOUNT_KEY, 'r') as f:
            sa_data = json.load(f)
        
        print(f"\n🔑 Service Account Details:")
        print(f"   - Project ID: {sa_data.get('project_id', 'N/A')}")
        print(f"   - Service Account Email: {sa_data.get('client_email', 'N/A')}")
        print(f"   - Auth URI: {sa_data.get('auth_uri', 'N/A')}")
        print(f"   - Token URI: {sa_data.get('token_uri', 'N/A')}")
        print(f"   - Private Key ID: {sa_data.get('private_key_id', 'N/A')[:20]}...")
        
        cred = credentials.Certificate(SERVICE_ACCOUNT_KEY)
        firebase_admin.initialize_app(cred, {
            'projectId': PROJECT_ID
        })
        print(f"\n✓ Firebase initialized successfully with project: {PROJECT_ID}")
        return firestore.client()
    except Exception as e:
        print(f"❌ ERROR: Failed to initialize Firebase: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

def create_test_sample():
    """Create a test sample with 3 facilities."""
    print(f"\n📋 Loading data from merged_medical_facilities.json")
    json_file = 'merged_medical_facilities.json'
    if not os.path.exists(json_file):
        print(f"❌ ERROR: {json_file} not found!")
        sys.exit(1)

    with open(json_file, 'r', encoding='utf-8') as f:
        all_facilities = json.load(f)
    
    print(f"✓ Loaded {len(all_facilities)} total facilities from JSON")

    # Select first 3 facilities
    test_facilities = all_facilities[:3]
    
    print(f"\n🔍 Creating test sample with 3 facilities:")
    print("=" * 60)

    for idx, facility in enumerate(test_facilities, 1):
        name = facility.get('name', 'Unknown')
        facility_type = facility.get('facilityType', 'Unknown')
        city = facility.get('city', 'N/A')
        province = facility.get('province', 'N/A')
        print(f"  {idx}. {name}")
        print(f"     Type: {facility_type}")
        print(f"     Location: {city}, {province}")

    print(f"\n📊 Total test facilities selected: {len(test_facilities)}")

    # Save test sample
    test_file = 'test_sample_facilities.json'
    with open(test_file, 'w', encoding='utf-8') as f:
        json.dump(test_facilities, f, ensure_ascii=False, indent=2)

    print(f"✓ Test sample saved to: {test_file}")
    return test_facilities

def upload_to_firestore(db, facilities):
    """Upload facilities to Firestore collection."""
    collection_name = 'medical_facility_listings'
    batch_size = 100  # Firestore batch write limit
    total_uploaded = 0
    total_errors = 0

    print(f"\n📤 Uploading {len(facilities)} facilities to Firestore...")
    print(f"   Collection: {collection_name}")
    print(f"   Batch size: {batch_size}")
    print("=" * 60)

    for i in range(0, len(facilities), batch_size):
        batch = db.batch()
        batch_facilities = facilities[i:i + batch_size]
        batch_num = (i // batch_size) + 1
        total_batches = (len(facilities) + batch_size - 1) // batch_size

        print(f"\n📦 Batch {batch_num}/{total_batches} ({len(batch_facilities)} facilities)...")

        try:
            for idx, facility in enumerate(batch_facilities, 1):
                # Use facility ID as document ID
                doc_id = facility.get('id') or facility.get('name', '').replace(' ', '_').lower()
                facility_name = facility.get('name', 'Unknown')
                
                # Add metadata
                facility['uploadedAt'] = datetime.now()
                facility['verified'] = False  # Mark as unverified
                
                doc_ref = db.collection(collection_name).document(doc_id)
                batch.set(doc_ref, facility)
                
                print(f"   {idx}. {facility_name} → doc_id: {doc_id[:40]}...")

            batch.commit()
            total_uploaded += len(batch_facilities)
            print(f"   ✓ Batch committed successfully! ({len(batch_facilities)} documents)")

        except Exception as e:
            print(f"   ❌ Error uploading batch: {e}")
            import traceback
            traceback.print_exc()
            total_errors += len(batch_facilities)

        time.sleep(0.5)  # Small delay between batches

    return total_uploaded, total_errors

def main():
    """Main upload function."""
    print("\n" + "=" * 60)
    print("🏥 Medical Facilities Firebase Upload (Admin SDK)")
    print("=" * 60)

    # Create test sample
    test_facilities = create_test_sample()

    if not test_facilities:
        print("❌ No facilities found for testing!")
        return

    # Initialize Firebase
    db = initialize_firebase()

    # Confirm upload
    print(f"\n⚠️  Ready to upload {len(test_facilities)} test facilities to Firestore")
    print("   WARNING: This will add test data to your database.")
    print(f"   Project: {PROJECT_ID}")
    response = input("\n❓ Proceed with upload? (yes/no): ").lower().strip()
    if response not in ['yes', 'y']:
        print("❌ Upload cancelled.")
        return

    # Upload to Firestore
    print(f"\n🚀 Starting upload...")
    start_time = time.time()
    total_uploaded, total_errors = upload_to_firestore(db, test_facilities)
    end_time = time.time()
    duration = end_time - start_time

    # Final summary
    collection_name = 'medical_facility_listings'
    print("\n" + "=" * 60)
    print("📊 UPLOAD SUMMARY")
    print("=" * 60)
    print(f"Total facilities processed: {len(test_facilities)}")
    print(f"✓ Successfully uploaded: {total_uploaded}")
    print(f"❌ Errors: {total_errors}")
    print(f"⏱️  Duration: {duration:.1f} seconds")
    print("="*60)

    if total_uploaded > 0:
        print(f"\n✅ SUCCESS: Data uploaded to collection: {collection_name}")
        print(f"   Facilities marked as 'unverified' - awaiting admin approval")
    else:
        print(f"\n⚠️  No facilities were uploaded. Check errors above.")

if __name__ == "__main__":
    main()