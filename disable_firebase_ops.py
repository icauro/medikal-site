#!/usr/bin/env python3
"""Disable Firebase operations by replacing them with console.log stubs."""

import re
from pathlib import Path

files_to_fix = [
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
    "app/profile/page.tsx",
    "app/signup/role-selection/page.tsx",
    "app/support/page.tsx",
    "app/support/tickets/[id]/page.tsx",
    "app/treatment-plan/page.tsx",
]

def stub_file(file_path):
    """Remove all Firebase code by replacing with stubs."""
    full_path = Path(file_path)
    if not full_path.exists():
        print(f"⚠️  Not found: {file_path}")
        return False
    
    content = full_path.read_text(encoding='utf-8')
    original = content
    
    # Replace Firebase calls with console warnings
    replacements = [
        # serverTimestamp()
        (r'(\s+)createdAt:\s*serverTimestamp\(\),?', r'\1createdAt: new Date().toISOString(),'),
        (r'(\s+)updatedAt:\s*serverTimestamp\(\),?', r'\1updatedAt: new Date().toISOString(),'),
        
        # getDocs and other async firestore ops - these are tricky
        # We'll replace entire function bodies
    ]
    
    for pattern, replacement in replacements:
        content = re.sub(pattern, replacement, content, flags=re.MULTILINE)
    
    # Replace entire query/getDocs patterns with empty arrays
    # This is a crude approach but will make code compile
    
    # Match const ... = await getDocs(...); patterns
    content = re.sub(
        r'const\s+(\w+)\s*=\s*await\s+getDocs\s*\([^)]+\);\n',
        r'const \1 = { docs: [] }; // [SUPABASE TODO]\n',
        content,
        flags=re.DOTALL | re.MULTILINE
    )
    
    # Match const ... = query(...) patterns  
    content = re.sub(
        r'(const\s+\w+\s*=\s*query\s*\([^;]+);)',
        r'/* [SUPABASE TODO] Query disabled for build\n    \1\n    */',
        content,
        flags=re.DOTALL
    )
    
    # Replace collection(db, ...) with empty reference
    content = re.sub(
        r'collection\s*\(\s*db\s*,\s*[^)]+\)',
        r'null as any /* [SUPABASE TODO] */,',
        content
    )
    
    # Replace await addDoc
    content = re.sub(
        r'await\s+addDoc\s*\([^)]+\);',
        r'/* [SUPABASE TODO] addDoc disabled */;',
        content
    )
    
    # Replace await updateDoc
    content = re.sub(
        r'await\s+updateDoc\s*\([^)]+\);',
        r'/* [SUPABASE TODO] updateDoc disabled */;',
        content
    )
    
    # Replace await deleteDoc
    content = re.sub(
        r'await\s+deleteDoc\s*\([^)]+\);',
        r'/* [SUPABASE TODO] deleteDoc disabled */;',
        content
    )
    
    if content != original:
        full_path.write_text(content, encoding='utf-8')
        print(f"✅ Stubbed: {file_path}")
        return True
    else:
        print(f"⏭️  No changes: {file_path}")
        return False

if __name__ == '__main__':
    count = sum(1 for f in files_to_fix if stub_file(f))
    print(f"\n📊 Updated {count}/{len(files_to_fix)} files")
