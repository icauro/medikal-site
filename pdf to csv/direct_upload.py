import json
import os
import sys
import requests
import time

# Firebase project configuration - you need to replace these with your actual values
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

def main():
    """Main upload function."""
    print("Direct Medical Facilities Upload")
    print("=" * 40)

    # Check if JSON file exists
    json_file = 'merged_medical_facilities.json'
    if not os.path.exists(json_file):
        print(f"ERROR: {json_file} not found!")
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

    # Get admin credentials from user input
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
    print(f"\nReady to upload {len(facilities)} facilities")
    print("WARNING: This will add new facilities to your database.")
    response = input("Proceed with upload? (yes/no): ").lower().strip()
    if response not in ['yes', 'y']:
        print("Upload cancelled.")
        return

    # Upload in batches
    batch_size = 50  # Smaller batches for API
    total_uploaded = 0
    total_errors = 0
    total_skipped = 0

    start_time = time.time()

    for i in range(0, len(facilities), batch_size):
        batch = facilities[i:i + batch_size]
        batch_num = (i // batch_size) + 1
        total_batches = (len(facilities) + batch_size - 1) // batch_size

        print(f"\nUploading batch {batch_num}/{total_batches} ({len(batch)} facilities)...")

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

        # Small delay between batches to avoid overwhelming the server
        time.sleep(0.5)

    # Final summary
    end_time = time.time()
    duration = end_time - start_time

    print("\n" + "=" * 40)
    print("FINAL UPLOAD SUMMARY")
    print("=" * 40)
    print(f"Total facilities processed: {len(facilities)}")
    print(f"Successfully uploaded: {total_uploaded}")
    print(f"Errors: {total_errors}")
    print(f"Skipped (already exist): {total_skipped}")
    print(f"Duration: {duration:.1f} seconds")
    print("\nUpload completed!")

    if total_uploaded > 0:
        print("You can now check the new facilities in your admin panel.")
        print("New facilities are marked as 'unverified' and need admin approval.")

if __name__ == "__main__":
    main()