#!/usr/bin/env python3
"""Remove Firebase code patterns from TypeScript files."""

import re
from pathlib import Path

# List of files to fix - those using collection, getDocs, etc.
files_with_firebase_code = [
    "app/add-review/page.tsx",
    "app/agencies/[slug]/page.tsx",
    "app/admin/page.tsx",
    "app/admin/support/page.tsx",
    "app/admin/components/AgencyListingCRUDModal.tsx",
    "app/admin/components/HealthcarePersonnelListingCRUDModal.tsx",
    "app/admin/components/MedicalFacilityListingCRUDModal.tsx",
    "app/admin/components/user-data/UserCRUDModal.tsx",
    "app/components/UserCommentsSection.tsx",
    "app/healthcare-database/page.tsx",
    "app/healthcare-personnel/page.tsx",
    "app/healthcare-personnel/[slug]/page.tsx",
    "app/medical-facilities/page.tsx",
    "app/medical-facilities/[slug]/page.tsx",
    "app/support/page.tsx",
    "app/support/tickets/[id]/page.tsx",
    "app/treatment-plan/page.tsx",
]

def stub_firebase_code(file_path):
    """Comment out Firebase code patterns."""
    full_path = Path(file_path)
    
    if not full_path.exists():
        print(f"⚠️  File not found: {file_path}")
        return False
    
    content = full_path.read_text(encoding='utf-8')
    original_content = content
    
    # Comment out lines containing Firebase Firestore patterns
    patterns = [
        (r'^\s*const\s+\w+Ref\s*=\s*collection\s*\([^)]*\);', 'Firestore collection call'),
        (r'^\s*const\s+\w+\s*=\s*await\s+getDocs\s*\([^)]*\);', 'Firestore getDocs call'),
        (r'^\s*await\s+addDoc\s*\([^)]*\);', 'Firestore addDoc call'),
        (r'^\s*await\s+updateDoc\s*\([^)]*\);', 'Firestore updateDoc call'),
        (r'^\s*await\s+deleteDoc\s*\([^)]*\);', 'Firestore deleteDoc call'),
        (r'collection\s*\(\s*db\s*,', 'Firebase collection() with db'),
        (r'query\s*\(\s*\w+Ref', 'Firebase query() with ref'),
        (r'where\s*\(\s*["\']', 'Firebase where() clause'),
    ]
    
    # This is a simple approach - just remove line if it contains problematic patterns
    lines = content.split('\n')
    new_lines = []
    i = 0
    while i < len(lines):
        line = lines[i]
        skip = False
        
        # Check if line has Firestore code
        if any(re.search(pattern[0], line, re.MULTILINE) for pattern in patterns):
            # Comment out the line
            commented = '    // [SUPABASE TODO] ' + line.strip()
            new_lines.append(commented)
            skip = True
        
        # Check for getDocs/addDoc/updateDoc/deleteDoc calls that span multiple lines
        if not skip and re.search(r'(collection|query|getDocs|addDoc|updateDoc|deleteDoc|where|limit|orderBy|serverTimestamp)\s*\(', line):
            if not re.search(r'\);?\s*$', line):  # Multi-line call
                # Comment out and find end of call
                commented = '    // [SUPABASE TODO] ' + line.strip()
                new_lines.append(commented)
                i += 1
                # Keep commenting lines until we find the closing paren
                paren_count = line.count('(') - line.count(')')
                while i < len(lines) and paren_count > 0:
                    line = lines[i]
                    paren_count += line.count('(') - line.count(')')
                    commented = '    // [SUPABASE TODO] ' + line.strip()
                    new_lines.append(commented)
                    i += 1
                continue
        
        if not skip:
            new_lines.append(line)
        i += 1
    
    new_content = '\n'.join(new_lines)
    
    if new_content != original_content:
        full_path.write_text(new_content, encoding='utf-8')
        print(f"✅ Stubbed Firebase code: {file_path}")
        return True
    else:
        print(f"⏭️  No Firebase code found: {file_path}")
        return False

def main():
    count = 0
    for file_path in files_with_firebase_code:
        if stub_firebase_code(file_path):
            count += 1
    
    print(f"\n📊 Stubbed Firebase code in {count}/{len(files_with_firebase_code)} files")

if __name__ == "__main__":
    main()
