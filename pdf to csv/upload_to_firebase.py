import json
import os
import sys
from datetime import datetime
import firebase_admin
from firebase_admin import credentials, firestore
from typing import List, Dict, Any

def initialize_firebase():
    """Initialize Firebase Admin SDK."""
    try:
        # Check if already initialized
        firebase_admin.get_app()
        print("Firebase already initialized")
    except ValueError:
        # Initialize with service account
        # First try to find service account key in common locations
        possible_key_paths = [
            'firebase-service-account-key.json',
            '../firebase-service-account-key.json',
            '../../firebase-service-account-key.json',
            os.path.join(os.path.dirname(__file__), 'firebase-service-account-key.json'),
            os.path.join(os.path.dirname(__file__), '..', 'firebase-service-account-key.json'),
        ]

        key_path = None
        for path in possible_key_paths:
            if os.path.exists(path):
                key_path = path
                break

        if not key_path:
            print("ERROR: Firebase service account key not found!")
            print("Please ensure 'firebase-service-account-key.json' is in the project root or pdf to csv directory")
            print("You can download it from: Firebase Console > Project Settings > Service Accounts")
            sys.exit(1)

        try:
            cred = credentials.Certificate(key_path)
            firebase_admin.initialize_app(cred)
            print(f"Firebase initialized successfully using key: {key_path}")
        except Exception as e:
            print(f"ERROR: Failed to initialize Firebase: {e}")
            sys.exit(1)

def validate_facility_data(facility: Dict[str, Any]) -> bool:
    """Validate facility data structure."""
    required_fields = ['name', 'facilityType', 'address', 'province', 'country']

    for field in required_fields:
        if field not in facility or not facility[field]:
            return False

    # Validate facility type
    valid_types = ['Solo Practice', 'Polyclinic', 'Clinic', 'Health Center', 'Hospital']
    if facility.get('facilityType') not in valid_types:
        return False

    return True

def prepare_facility_for_firestore(facility: Dict[str, Any]) -> Dict[str, Any]:
    """Prepare facility data for Firestore insertion."""
    # Create Firestore document structure
    doc_data = {
        'name': facility['name'],
        'facilityType': facility['facilityType'],
        'address': facility['address'],
        'province': facility['province'],
        'country': facility['country'],
        'slug': facility.get('slug', ''),
        'createdAt': firestore.SERVER_TIMESTAMP,
        'updatedAt': firestore.SERVER_TIMESTAMP,
        'createdBy': 'system_import',  # You can change this to your admin UID
        'verified': False,  # New facilities start as unverified
    }

    # Optional fields
    if facility.get('phone'):
        doc_data['phone'] = facility['phone']

    return doc_data

def upload_facilities_batch(db, facilities: List[Dict[str, Any]], batch_size: int = 100) -> tuple[int, int]:
    """Upload facilities in batches to Firestore."""
    total_uploaded = 0
    total_errors = 0

    for i in range(0, len(facilities), batch_size):
        batch = facilities[i:i + batch_size]
        batch_num = (i // batch_size) + 1
        total_batches = (len(facilities) + batch_size - 1) // batch_size

        print(f"Processing batch {batch_num}/{total_batches} ({len(batch)} facilities)...")

        # Create Firestore batch
        firestore_batch = db.batch()
        batch_operations = 0

        for facility in batch:
            try:
                if not validate_facility_data(facility):
                    print(f"  Skipping invalid facility: {facility.get('name', 'Unknown')}")
                    total_errors += 1
                    continue

                # Generate document ID from slug
                doc_id = facility.get('slug', '')
                if not doc_id:
                    # Fallback: create a simple ID
                    import hashlib
                    name_hash = hashlib.md5(f"{facility['name']}_{facility['province']}".encode()).hexdigest()[:16]
                    doc_id = f"facility_{name_hash}"

                # Prepare data for Firestore
                doc_data = prepare_facility_for_firestore(facility)

                # Add to batch
                doc_ref = db.collection('medical_facility_listings').document(doc_id)
                firestore_batch.set(doc_ref, doc_data)
                batch_operations += 1

            except Exception as e:
                print(f"  Error preparing facility {facility.get('name', 'Unknown')}: {e}")
                total_errors += 1
                continue

        # Commit batch
        if batch_operations > 0:
            try:
                firestore_batch.commit()
                total_uploaded += batch_operations
                print(f"  Successfully uploaded {batch_operations} facilities")
            except Exception as e:
                print(f"  ERROR: Failed to commit batch {batch_num}: {e}")
                total_errors += batch_operations
        else:
            print(f"  No valid operations in batch {batch_num}")

    return total_uploaded, total_errors

def check_existing_facilities(db) -> int:
    """Check how many facilities already exist in Firestore."""
    try:
        collection_ref = db.collection('medical_facility_listings')
        docs = collection_ref.limit(1).get()  # Just check if collection exists
        # Get total count (this is approximate for large collections)
        all_docs = collection_ref.get()
        count = len(all_docs)
        return count
    except Exception as e:
        print(f"Warning: Could not check existing facilities: {e}")
        return 0

def main():
    """Main upload function."""
    print("Firebase Medical Facilities Upload Tool")
    print("=" * 50)

    # Check if JSON file exists
    json_file = 'merged_medical_facilities.json'
    if not os.path.exists(json_file):
        print(f"ERROR: {json_file} not found!")
        print("Please run merge_csv_for_firebase.py first to create the merged data.")
        sys.exit(1)

    # Load facilities data
    print(f"Loading facilities from {json_file}...")
    try:
        with open(json_file, 'r', encoding='utf-8') as f:
            facilities = json.load(f)
        print(f"Loaded {len(facilities)} facilities")
    except Exception as e:
        print(f"ERROR: Failed to load JSON file: {e}")
        sys.exit(1)

    # Initialize Firebase
    print("\nInitializing Firebase...")
    initialize_firebase()

    # Get Firestore client
    db = firestore.client()

    # Check existing facilities
    print("\nChecking existing facilities...")
    existing_count = check_existing_facilities(db)
    print(f"Found {existing_count} existing medical facilities in database")

    if existing_count > 0:
        print("\nWARNING: Database already contains medical facilities!")
        response = input("Do you want to continue? This may overwrite existing data. (yes/no): ").lower().strip()
        if response not in ['yes', 'y']:
            print("Upload cancelled by user.")
            return

    # Confirm upload
    print(f"\nReady to upload {len(facilities)} facilities to Firestore")
    response = input("Proceed with upload? (yes/no): ").lower().strip()
    if response not in ['yes', 'y']:
        print("Upload cancelled by user.")
        return

    # Start upload
    start_time = datetime.now()
    print(f"\nStarting upload at {start_time.strftime('%H:%M:%S')}...")

    uploaded, errors = upload_facilities_batch(db, facilities, batch_size=100)

    # Summary
    end_time = datetime.now()
    duration = end_time - start_time

    print("\n" + "=" * 50)
    print("UPLOAD SUMMARY")
    print("=" * 50)
    print(f"Total facilities processed: {len(facilities)}")
    print(f"Successfully uploaded: {uploaded}")
    print(f"Errors: {errors}")
    print(f"Duration: {duration.total_seconds():.1f} seconds")
    print(".1f"    print("\nUpload completed!")

    if uploaded > 0:
        print("You can now check the facilities in your admin panel.")
        print("New facilities are marked as 'unverified' and need admin approval.")

if __name__ == "__main__":
    main()