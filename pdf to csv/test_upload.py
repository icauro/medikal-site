import json
import os

def create_test_data():
    """Create a small test dataset from the merged data."""
    json_file = 'merged_medical_facilities.json'

    if not os.path.exists(json_file):
        print(f"ERROR: {json_file} not found!")
        return False

    # Load full data
    with open(json_file, 'r', encoding='utf-8') as f:
        all_facilities = json.load(f)

    # Take first 10 facilities for testing
    test_facilities = all_facilities[:10]

    # Save test data
    test_file = 'test_facilities.json'
    with open(test_file, 'w', encoding='utf-8') as f:
        json.dump(test_facilities, f, ensure_ascii=False, indent=2)

    print(f"Created test file: {test_file} with {len(test_facilities)} facilities")
    print("\nTest facilities:")
    for i, facility in enumerate(test_facilities, 1):
        print(f"{i}. {facility['name']} ({facility['facilityType']}) - {facility['province']}")

    return True

if __name__ == "__main__":
    print("Creating test data for upload...")
    create_test_data()