import json
import os
import sys
import firebase_admin
from firebase_admin import credentials, firestore
import time
from collections import defaultdict

def upload_test_facilities():
    """Upload test facilities directly using Firebase Admin SDK."""

    # Initialize Firebase Admin (this should work without service account key for dev)
    try:
        # Check if already initialized
        firebase_admin.get_app()
        print("Firebase already initialized")
    except ValueError:
        # Initialize without service account (works in development)
        firebase_admin.initialize_app(options={
            'projectId': 'mpturkey-ccd57'
        })
        print("Firebase initialized for development")

    # Get Firestore client
    db = firestore.client()

    # Load test facilities
    test_file = 'test_sample_facilities.json'
    if not os.path.exists(test_file):
        print(f"ERROR: {test_file} not found!")
        return False

    with open(test_file, 'r', encoding='utf-8') as f:
        test_facilities = json.load(f)

    print(f"Loaded {len(test_facilities)} test facilities for upload")

    # Check existing facilities
    try:
        collection_ref = db.collection('medical_facility_listings')
        existing_docs = collection_ref.get()
        existing_count = len(existing_docs)
        print(f"Found {existing_count} existing facilities in database")
    except Exception as e:
        print(f"Warning: Could not check existing facilities: {e}")
        existing_count = 0

    # Upload in batches
    batch_size = 10
    total_uploaded = 0
    total_errors = 0
    total_skipped = 0

    start_time = time.time()

    print("\nStarting upload...")

    for i in range(0, len(test_facilities), batch_size):
        batch = test_facilities[i:i + batch_size]
        batch_num = (i // batch_size) + 1
        total_batches = (len(test_facilities) + batch_size - 1) // batch_size

        print(f"\nUploading batch {batch_num}/{total_batches} ({len(batch)} facilities)...")

        # Use Firestore batch
        firestore_batch = db.batch()

        for facility in batch:
            try:
                # Generate document ID from slug
                doc_id = facility.get('slug', f"test_{int(time.time())}_{hash(str(facility))}")

                # Prepare document data
                doc_data = {
                    'name': facility['name'],
                    'facilityType': facility['facilityType'],
                    'address': facility['address'],
                    'province': facility['province'],
                    'country': facility['country'],
                    'phone': facility.get('phone'),
                    'slug': facility['slug'],
                    'createdAt': firestore.SERVER_TIMESTAMP,
                    'updatedAt': firestore.SERVER_TIMESTAMP,
                    'createdBy': 'system_test_upload',
                    'verified': False,
                    'rating': 0,
                    'reviewCount': 0
                }

                # Add to batch
                doc_ref = db.collection('medical_facility_listings').document(doc_id)
                firestore_batch.set(doc_ref, doc_data)

            except Exception as e:
                print(f"  Error preparing facility {facility.get('name', 'Unknown')}: {e}")
                total_errors += 1
                continue

        # Commit batch
        if firestore_batch:
            try:
                firestore_batch.commit()
                total_uploaded += len(batch) - total_errors
                print(f"  Successfully uploaded {len(batch) - total_errors} facilities")
            except Exception as e:
                print(f"  ERROR: Failed to commit batch: {e}")
                total_errors += len(batch)
        else:
            print("  No operations in batch")

        # Small delay between batches
        time.sleep(0.5)

    # Final summary
    end_time = time.time()
    duration = end_time - start_time

    print("\n" + "=" * 50)
    print("TEST UPLOAD SUMMARY")
    print("=" * 50)
    print(f"Test facilities processed: {len(test_facilities)}")
    print(f"Successfully uploaded: {total_uploaded}")
    print(f"Errors: {total_errors}")
    print(f"Duration: {duration:.1f} seconds")
    print("\nTest upload completed!")

    if total_uploaded > 0:
        print("✅ Test facilities uploaded successfully!")
        print("You can now check them in your admin panel.")
        print("Test facilities are marked as 'unverified' and need admin approval.")
        return True
    else:
        print("❌ No facilities were uploaded.")
        return False

if __name__ == "__main__":
    success = upload_test_facilities()
    if success:
        print("\n🎉 Upload successful! Check your admin panel for the test facilities.")
    else:
        print("\n❌ Upload failed. Check the error messages above.")