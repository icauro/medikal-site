#!/usr/bin/env python3
"""Remove Firebase imports from TypeScript files."""

import os
import re
from pathlib import Path

# List of files to process
files_to_fix = [
    "app/add-review/page.tsx",
    "app/admin/components/AgencyListingCRUDModal.tsx",
    "app/admin/components/HealthcarePersonnelListingCRUDModal.tsx",
    "app/admin/components/MedicalFacilityListingCRUDModal.tsx",
    "app/admin/components/user-data/UserCRUDModal.tsx",
    "app/admin/page.tsx",
    "app/admin/support/page.tsx",
    "app/agencies/[slug]/page.tsx",
    "app/components/UserCommentsSection.tsx",
    "app/healthcare-database/page.tsx",
    "app/healthcare-personnel/page.tsx",
    "app/healthcare-personnel/[slug]/page.tsx",
    "app/medical-facilities/page.tsx",
    "app/medical-facilities/[slug]/page.tsx",
    "app/profile/page.tsx",
    "app/signup/role-selection/page.tsx",
    "app/support/page.tsx",
    "app/support/tickets/[id]/page.tsx",
    "app/treatment-plan/page.tsx",
]

def remove_firebase_imports(file_path):
    """Remove Firebase imports from a file."""
    full_path = Path(file_path)
    
    if not full_path.exists():
        print(f"⚠️  File not found: {file_path}")
        return False
    
    content = full_path.read_text(encoding='utf-8')
    original_content = content
    
    # Remove Firebase imports (various patterns)
    patterns = [
        r'import\s*{[^}]*db[^}]*}\s*from\s*["\']@/lib/firebase["\'];\n?',
        r'import\s*{\s*db\s*}\s*from\s*["\']@/lib/firebase["\'];\n?',
        r'import\s*{[^}]*from\s*["\']firebase/firestore["\'];\n?',
        r'import\s*{\s*[^}]*serverTimestamp[^}]*}\s*from\s*["\']firebase/firestore["\'];\n?',
        r'import\s*{\s*[^}]*collection[^}]*getDocs[^}]*}\s*from\s*["\']firebase/firestore["\'];\n?',
        r'import\s*{\s*[^}]*doc[^}]*}\s*from\s*["\']firebase/firestore["\'];\n?',
        r'import\s*{\s*[^}]*updateDoc[^}]*}\s*from\s*["\']firebase/firestore["\'];\n?',
        r'import\s*{\s*[^}]*query[^}]*where[^}]*}\s*from\s*["\']firebase/firestore["\'];\n?',
        # Catch remaining firestore imports
        r'import\s*{[^}]*}\s*from\s*["\']firebase/firestore["\'];\n?',
    ]
    
    for pattern in patterns:
        content = re.sub(pattern, '', content, flags=re.MULTILINE | re.DOTALL)
    
    # Clean up multiple consecutive newlines
    content = re.sub(r'\n\n\n+', '\n\n', content)
    
    if content != original_content:
        full_path.write_text(content, encoding='utf-8')
        print(f"✅ Updated: {file_path}")
        return True
    else:
        print(f"⏭️  No changes needed: {file_path}")
        return False

def main():
    os.chdir(".")  # Use current directory
    
    count = 0
    for file_path in files_to_fix:
        if remove_firebase_imports(file_path):
            count += 1
    
    print(f"\n📊 Updated {count}/{len(files_to_fix)} files")

if __name__ == "__main__":
    main()
