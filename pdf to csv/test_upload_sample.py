import json
import os
import sys
import requests
import time
from collections import defaultdict

# Firebase project configuration
FIREBASE_API_KEY = "AIza-REDACTED-BY-HISTORY-REWRITE"
FIREBASE_AUTH_DOMAIN = "mpturkey-ccd57.firebaseapp.com"
UPLOAD_API_URL = "http://localhost:3000/api/upload-facilities"

def get_id_token(email: str, password: str) -> str:
    """Get Firebase ID token for authentication."""
    url = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={FIREBASE_API_KEY}"

    payload = {
        "email": email,
        "password": password,
        "returnSecureToken": True
    }

    try:
        response = requests.post(url, json=payload)
        response.raise_for_status()
        data = response.json()
        return data['idToken']
    except requests.exceptions.RequestException as e:
        print(f"Authentication failed: {e}")
        if hasattr(e, 'response') and e.response:
            try:
                error_data = e.response.json()
                print(f"Server error: {error_data.get('error', 'Unknown error')}")
            except:
                print(f"Response: {e.response.text}")
        raise

def upload_batch(token: str, facilities: list, batch_index: int) -> dict:
    """Upload a batch of facilities to the API."""
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }

    payload = {
        'facilities': facilities,
        'batchIndex': batch_index
    }

    try:
        response = requests.post(UPLOAD_API_URL, json=payload, headers=headers, timeout=30)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Upload failed for batch {batch_index + 1}: {e}")
        if hasattr(e, 'response') and e.response:
            try:
                error_data = e.response.json()
                print(f"Server error: {error_data.get('error', 'Unknown error')}")
            except:
                print(f"Response: {e.response.text}")
        raise

def create_test_sample():
    """Create a test sample with 3 facilities from each type."""
    # Load the full JSON file
    json_file = 'merged_medical_facilities.json'
    if not os.path.exists(json_file):
        print(f"ERROR: {json_file} not found!")
        sys.exit(1)

    with open(json_file, 'r', encoding='utf-8') as f:
        all_facilities = json.load(f)

    # Group facilities by type
    facilities_by_type = defaultdict(list)
    for facility in all_facilities:
        facility_type = facility['facilityType']
        facilities_by_type[facility_type].append(facility)

    # Select 3 facilities from each type
    test_facilities = []
    print("Creating test sample with 3 facilities from each type:")
    print("=" * 60)

    for facility_type, facilities in sorted(facilities_by_type.items()):
        available = len(facilities)
        selected_count = min(3, available)

        # Take first 3 facilities (or all if less than 3)
        selected = facilities[:selected_count]
        test_facilities.extend(selected)

        print(f"{facility_type}: {selected_count} selected (from {available} available)")
        for facility in selected:
            print(f"  - {facility['name']}")

    print(f"\nTotal test facilities: {len(test_facilities)}")

    # Save test sample
    test_file = 'test_sample_facilities.json'
    with open(test_file, 'w', encoding='utf-8') as f:
        json.dump(test_facilities, f, ensure_ascii=False, indent=2)

    print(f"Test sample saved to: {test_file}")
    return test_facilities

def main():
    """Main upload function for test sample."""
    print("Medical Facilities Test Upload")
    print("=" * 40)

    # Create test sample
    test_facilities = create_test_sample()

    if not test_facilities:
        print("No facilities found for testing!")
        return

    # Get admin credentials
    print("\nAdmin Authentication Required")
    print("Please enter your admin account credentials:")
    email = input("Email: ").strip()
    password = input("Password: ").strip()

    if not email or not password:
        print("ERROR: Email and password are required")
        sys.exit(1)

    # Authenticate
    print("\nAuthenticating...")
    try:
        token = get_id_token(email, password)
        print("Authentication successful!")
    except Exception as e:
        print(f"Authentication failed: {e}")
        sys.exit(1)

    # Check server connection
    print("\nChecking server connection...")
    try:
        response = requests.get("http://localhost:3000/api/upload-facilities", timeout=10)
        if response.status_code != 200:
            print("ERROR: Server is not responding. Make sure Next.js is running on localhost:3000")
            sys.exit(1)
        print("Server connection OK")
    except requests.exceptions.RequestException:
        print("ERROR: Cannot connect to server. Make sure Next.js is running on localhost:3000")
        sys.exit(1)

    # Confirm upload
    print(f"\nReady to upload {len(test_facilities)} test facilities")
    print("WARNING: This will add test data to your database.")
    response = input("Proceed with test upload? (yes/no): ").lower().strip()
    if response not in ['yes', 'y']:
        print("Upload cancelled.")
        return

    # Upload in batches
    batch_size = 10  # Smaller batches for testing
    total_uploaded = 0
    total_errors = 0
    total_skipped = 0

    start_time = time.time()

    for i in range(0, len(test_facilities), batch_size):
        batch = test_facilities[i:i + batch_size]
        batch_num = (i // batch_size) + 1
        total_batches = (len(test_facilities) + batch_size - 1) // batch_size

        print(f"\nUploading test batch {batch_num}/{total_batches} ({len(batch)} facilities)...")

        try:
            result = upload_batch(token, batch, batch_num - 1)

            if result.get('success'):
                batch_results = result['results']
                total_uploaded += batch_results['uploaded']
                total_errors += batch_results['errors']
                total_skipped += batch_results['skipped']

                print(f"  Uploaded: {batch_results['uploaded']}")
                print(f"  Errors: {batch_results['errors']}")
                print(f"  Skipped: {batch_results['skipped']}")

                # Show some details for errors
                if batch_results['errors'] > 0:
                    error_details = [d for d in batch_results['details'] if 'Error' in d or 'Skipped' in d][:3]
                    for detail in error_details:
                        print(f"    {detail}")
            else:
                print(f"  ERROR: {result.get('error', 'Unknown error')}")

        except Exception as e:
            print(f"  FAILED: {e}")
            total_errors += len(batch)

        # Small delay between batches
        time.sleep(0.5)

    # Final summary
    end_time = time.time()
    duration = end_time - start_time

    print("\n" + "=" * 40)
    print("TEST UPLOAD SUMMARY")
    print("=" * 40)
    print(f"Test facilities processed: {len(test_facilities)}")
    print(f"Successfully uploaded: {total_uploaded}")
    print(f"Errors: {total_errors}")
    print(f"Skipped (already exist): {total_skipped}")
    print(f"Duration: {duration:.1f} seconds")
    print("\nTest upload completed!")

    if total_uploaded > 0:
        print("You can now check the test facilities in your admin panel.")
        print("Test facilities are marked as 'unverified' and need admin approval.")

if __name__ == "__main__":
    main()