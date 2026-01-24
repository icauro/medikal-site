import csv
import os
import re
from typing import Dict, List, Optional
import json

# Facility type mapping from Turkish to English enum values
FACILITY_TYPE_MAPPING = {
    'Muayenehane': 'Solo Practice',
    'Özel Tıp Merkezi': 'Medical Center',
    'Özel Hastane': 'Hospital',
    'Vakıf Üniversitesi Hastanesi': 'Hospital',
    'Kamu Hastanesi': 'Hospital',
    'Kamu Üniversitesi Hastanesi': 'Hospital',
    'Özel Ağız ve Diş Sağlığı Polikliniği': 'Private Oral and Dental Health Polyclinic',
    'Özel Ağız ve Diş Sağlığı Merkezi': 'Private Oral and Dental Health Center',
    'Özel Ağız ve Diş Sağlığı Hastanesi': 'Private Oral and Dental Health Hospital',
    'Kamu Ağız ve Diş Sağlığı Hastanesi': 'Hospital',
    'Kamu Ağız ve Diş Sağlığı Merkezi': 'Polyclinic',
    'Konaklamalı Fizik Tedavi ve Rehabilitasyon Merkezi': 'Clinic',
    'Müstakil Öğrenmeye Yardımcı Tedavi Merkezi': 'Clinic',
    'Radyoloji Merkezi': 'Clinic',
    'Genetik Hastalıklar Değerlendirme Merkezi': 'Clinic',
    'Özel Diyaliz Merkezi': 'Clinic'
}

def clean_facility_name(name: str) -> str:
    """Clean facility name by removing extra whitespace and quotes."""
    if not name:
        return ""
    # Remove extra quotes and clean whitespace
    name = name.strip().strip('"').strip("'")
    # Remove extra whitespace
    name = re.sub(r'\s+', ' ', name)
    return name

def clean_address(address: str) -> str:
    """Clean address by removing extra whitespace and quotes."""
    if not address:
        return ""
    # Remove extra quotes and clean whitespace
    address = address.strip().strip('"').strip("'")
    # Remove extra whitespace
    address = re.sub(r'\s+', ' ', address)
    return address

def clean_phone(phone: str) -> Optional[str]:
    """Clean phone number."""
    if not phone or phone.strip() in ['', '0']:
        return None
    # Remove extra whitespace
    phone = re.sub(r'\s+', ' ', phone.strip())
    return phone

def map_facility_type(turkish_type: str) -> str:
    """Map Turkish facility type to English enum value."""
    # Direct mapping
    if turkish_type in FACILITY_TYPE_MAPPING:
        return FACILITY_TYPE_MAPPING[turkish_type]

    # Partial matching for complex names
    for key, value in FACILITY_TYPE_MAPPING.items():
        if key.lower() in turkish_type.lower():
            return value

    # Default fallback
    if 'hastane' in turkish_type.lower() or 'hospital' in turkish_type.lower():
        return 'Hospital'
    elif 'poliklinik' in turkish_type.lower() or 'polyclinic' in turkish_type.lower():
        return 'Polyclinic'
    elif 'klinik' in turkish_type.lower() or 'clinic' in turkish_type.lower():
        return 'Clinic'
    elif 'merkez' in turkish_type.lower() or 'center' in turkish_type.lower():
        return 'Clinic'
    else:
        return 'Clinic'  # Default

def generate_slug(name: str, province: str) -> str:
    """Generate URL-friendly slug from name and province."""
    # Clean and lowercase
    clean_name = re.sub(r'[^\w\s-]', '', name.lower())
    clean_province = re.sub(r'[^\w\s-]', '', province.lower())

    # Replace spaces with hyphens
    slug = re.sub(r'[\s_]+', '-', f"{clean_name}-{clean_province}")

    # Remove multiple hyphens
    slug = re.sub(r'-+', '-', slug)

    # Remove leading/trailing hyphens
    slug = slug.strip('-')

    return slug[:100]  # Limit length

def process_csv_file(file_path: str) -> List[Dict]:
    """Process a single CSV file and return list of facility dictionaries."""
    facilities = []

    print(f"Processing {os.path.basename(file_path)}...")

    with open(file_path, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        headers = next(reader)  # Skip header row

        for row_num, row in enumerate(reader, start=2):
            try:
                if len(row) < 6:
                    print(f"  Warning: Row {row_num} has insufficient columns ({len(row)}), skipping")
                    continue

                # Extract data (adjust indices based on CSV structure)
                no = row[0].strip()
                province = row[1].strip()
                name = clean_facility_name(row[2])
                facility_type_turkish = row[3].strip()
                address = clean_address(row[4])
                phone = clean_phone(row[5])

                # Skip if essential data is missing
                if not name or not province:
                    print(f"  Warning: Row {row_num} missing essential data (name or province), skipping")
                    continue

                # Map facility type
                facility_type = map_facility_type(facility_type_turkish)

                # Generate slug
                slug = generate_slug(name, province)

                # Create facility object
                facility = {
                    'name': name,
                    'facilityType': facility_type,
                    'address': address,
                    'province': province,
                    'country': 'Turkey',
                    'phone': phone,
                    'slug': slug
                }

                facilities.append(facility)

            except Exception as e:
                print(f"  Error processing row {row_num}: {e}")
                continue

    print(f"  Processed {len(facilities)} facilities from {os.path.basename(file_path)}")
    return facilities

def remove_duplicates(facilities: List[Dict]) -> List[Dict]:
    """Remove duplicate facilities based on name and address."""
    seen = set()
    unique_facilities = []

    for facility in facilities:
        # Create a unique key
        key = (facility['name'].lower(), facility['address'].lower() if facility['address'] else '')

        if key not in seen:
            seen.add(key)
            unique_facilities.append(facility)
        else:
            print(f"  Duplicate removed: {facility['name']}")

    return unique_facilities

def main():
    """Main function to merge all CSV files."""
    output_dir = 'output'
    csv_files = [
        os.path.join(output_dir, 'hastanelerpdf.csv'),
        os.path.join(output_dir, 'muayenehanelerpdf.csv'),
        os.path.join(output_dir, 'tip-merkezleripdf.csv'),
        os.path.join(output_dir, 'diger-saglik-tesisleripdf.csv')
    ]

    all_facilities = []

    print("Starting CSV merge process...")
    print("=" * 60)

    # Check if files exist
    for csv_file in csv_files:
        if not os.path.exists(csv_file):
            print(f"Error: {csv_file} not found!")
            return

    # Process each CSV file
    for csv_file in csv_files:
        try:
            facilities = process_csv_file(csv_file)
            all_facilities.extend(facilities)
        except Exception as e:
            print(f"Error processing {csv_file}: {e}")
            continue

    print("\nProcessing Summary:")
    print(f"  Total facilities before deduplication: {len(all_facilities)}")

    # Remove duplicates
    unique_facilities = remove_duplicates(all_facilities)

    print(f"  Total facilities after deduplication: {len(unique_facilities)}")
    print(f"  Duplicates removed: {len(all_facilities) - len(unique_facilities)}")

    # Save merged data as JSON for Supabase import via API
    output_file = 'merged_medical_facilities.json'

    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(unique_facilities, f, ensure_ascii=False, indent=2)

    print(f"\nSuccessfully created {output_file}")
    print(f"   Contains {len(unique_facilities)} medical facilities")
    print(f"   Use API endpoint to import to Supabase")

    # Also save as CSV for backup
    csv_output_file = 'merged_medical_facilities.csv'

    if unique_facilities:
        fieldnames = unique_facilities[0].keys()

        with open(csv_output_file, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(unique_facilities)

        print(f"Also saved as {csv_output_file}")

    # Print facility type distribution
    print("\nFacility Type Distribution:")
    from collections import Counter
    type_counts = Counter(f['facilityType'] for f in unique_facilities)
    for facility_type, count in sorted(type_counts.items()):
        print(f"  {facility_type}: {count}")

    print("\nMerge process completed successfully!")
    print(f"Output files: {output_file}, {csv_output_file}")

if __name__ == "__main__":
    main()