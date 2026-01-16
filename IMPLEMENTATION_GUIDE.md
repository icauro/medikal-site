# Implementation Guide for Enhanced Features

## Summary of Foundation Changes

### ✅ Completed
1. **slugify package** - Installed
2. **lib/constants.ts** - Centralized constants (COUNTRIES, MEDICAL_SPECIALIZATIONS, etc.)
3. **lib/utils.ts** - Utility functions:
   - `generateSlug(text)` - Replace all inline slug generation
   - `validateEmail(email)` - Email validation
   - `validatePhone(phone)` - Phone validation
   - `validateURL(url)` - URL validation
   - `formatDate(date)` - Date formatting
   - `formatDateTime(date)` - Date + time formatting
   - `getTimeAgo(date)` - Relative time (e.g., "2 hours ago")
   - `truncateText(text)` - Text truncation
   - `validateRequiredFields(obj, fields)` - Batch validation
   - `hasErrors(errors)` - Check if errors exist
   - `getErrorMessages(errors)` - Get error strings

4. **app/components/Toast.tsx** - Toast notification system:
   - `useToast()` hook - `toast.success()`, `toast.error()`, `toast.warning()`, `toast.info()`
   - `ConfirmDialog` component - For delete confirmations
   - `ToastContainer` - Add to layout (already done)

5. **app/layout.tsx** - Added ToastContainer

---

## Next Steps - Template Code

### Step 1: Update One Modal (OpenHealthcarePersonnelModal.tsx)

Replace at the top:
```tsx
// OLD
import { Country } from "country-state-city";
const COUNTRIES = Country.getAllCountries();

// NEW
import { COUNTRIES } from "@/lib/constants";
import { generateSlug, validateEmail, validateURL } from "@/lib/utils";
import { useToast, ConfirmDialog } from "@/app/components/Toast";
```

Add state for delete confirmation:
```tsx
const { success, error } = useToast();
const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
```

Replace slug generation in handleSave:
```tsx
// OLD
const slug = openData.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

// NEW
const slug = generateSlug(openData.name);
```

Add validation:
```tsx
const handleSave = async () => {
  // Existing checks
  if (!openData.name) {
    error("Name is required");
    return;
  }
  
  // Add new validation
  if (openData.email && !validateEmail(openData.email)) {
    error("Invalid email format");
    return;
  }
  
  if (openData.website && !validateURL(openData.website)) {
    error("Invalid website URL");
    return;
  }
  
  // ... rest of logic
  
  try {
    // ... save logic
    success("Healthcare personnel listing saved successfully!");
  } catch (err: any) {
    error(err.message || "Failed to save");
  }
};
```

Replace delete confirmation:
```tsx
// OLD
const handleDelete = async () => {
  if (!openData.id || !confirm("Are you sure...")) return;

// NEW
const handleDelete = async () => {
  if (!openData.id) return;
  setIsDeleteConfirmOpen(true);
};

const handleConfirmDelete = async () => {
  setLoading(true);
  try {
    await deleteDoc(doc(db, "open_healthcare_personnel_data", openData.id!));
    success("Listing deleted successfully");
    onSuccess();
    onClose();
  } catch (err: any) {
    error(err.message);
  } finally {
    setLoading(false);
    setIsDeleteConfirmOpen(false);
  }
};
```

Add keyboard shortcut:
```tsx
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && isOpen) {
      onClose();
    }
  };
  
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [isOpen, onClose]);
```

Add ConfirmDialog in JSX:
```tsx
<ConfirmDialog
  isOpen={isDeleteConfirmOpen}
  title="Delete Listing"
  message="This action cannot be undone. The public listing will be permanently deleted."
  confirmText="Delete"
  cancelText="Cancel"
  isDangerous={true}
  onConfirm={handleConfirmDelete}
  onCancel={() => setIsDeleteConfirmOpen(false)}
  isLoading={loading}
/>
```

---

### Step 2: Add Timestamp Display

In listing pages (doctors/page.tsx, agencies/page.tsx, medical-facilities/page.tsx):

```tsx
import { formatDate, getTimeAgo } from "@/lib/utils";

// In the card display:
<div className="text-xs text-zinc-500 mt-2">
  Last updated: {getTimeAgo(doctor.updatedAt)}
</div>

// Or full date:
<div className="text-xs text-zinc-500 mt-2">
  Listed on: {formatDate(doctor.createdAt)}
</div>
```

---

### Step 3: Add Filtering

Example for doctors/page.tsx:

```tsx
import { COUNTRIES } from "@/lib/constants";

// Add state
const [selectedCountry, setSelectedCountry] = useState<string>("");
const [selectedCity, setSelectedCity] = useState<string>("");
const [cities, setCities] = useState<any[]>([]);

// Add useEffect for cities
useEffect(() => {
  if (selectedCountry) {
    const country = COUNTRIES.find(c => c.name === selectedCountry);
    if (country) {
      const countryCities = City.getCitiesOfCountry(country.isoCode);
      setCities(countryCities || []);
    }
  } else {
    setCities([]);
  }
}, [selectedCountry]);

// Modify query
const buildQuery = () => {
  let q = query(personnelCollection);
  
  if (selectedCountry) {
    q = query(personnelCollection, where("country", "==", selectedCountry));
  }
  if (selectedCity) {
    q = query(personnelCollection, 
      where("country", "==", selectedCountry),
      where("city", "==", selectedCity)
    );
  }
  
  return q;
};

// Add filters UI before the list
<div className="mb-6 grid grid-cols-2 gap-4">
  <select 
    value={selectedCountry} 
    onChange={(e) => { setSelectedCountry(e.target.value); setSelectedCity(""); }}
    className="bg-zinc-800 border border-zinc-700 rounded p-2 text-white"
  >
    <option value="">All Countries</option>
    {COUNTRIES.map(c => <option key={c.isoCode} value={c.name}>{c.name}</option>)}
  </select>
  
  <select 
    value={selectedCity} 
    onChange={(e) => setSelectedCity(e.target.value)}
    disabled={!selectedCountry}
    className="bg-zinc-800 border border-zinc-700 rounded p-2 text-white disabled:opacity-50"
  >
    <option value="">All Cities</option>
    {cities.map((city, idx) => <option key={`${city.name}-${idx}`} value={city.name}>{city.name}</option>)}
  </select>
</div>
```

---

## Checklists

### Modal Updates (6 files):
- [ ] OpenHealthcarePersonnelModal.tsx
- [ ] OpenMedicalFacilityModal.tsx
- [ ] OpenAgencyModal.tsx
- [ ] HealthcarePersonnelUserModal.tsx
- [ ] MedicalFacilityUserModal.tsx
- [ ] AgencyUserModal.tsx

For each, add:
- [ ] Import from lib/constants, lib/utils, Toast
- [ ] useToast hook
- [ ] Delete confirmation state + dialog
- [ ] Slug generation with generateSlug()
- [ ] Form validation (email, phone, URL)
- [ ] Toast success/error messages
- [ ] Keyboard shortcut (Escape key)

### Listing Pages (3 files):
- [ ] doctors/page.tsx - Add country/city filters
- [ ] agencies/page.tsx - Add country/city filters
- [ ] medical-facilities/page.tsx - Add country/city filters

For each, add:
- [ ] Import COUNTRIES and City
- [ ] Filter state (selectedCountry, selectedCity, cities)
- [ ] useEffect for loading cities
- [ ] Query builder with where clauses
- [ ] Filter UI dropdowns
- [ ] Timestamp display (formatDate/getTimeAgo)

---

## Testing Checklist
- [ ] Create new listing - shows success toast
- [ ] Edit listing - shows success toast
- [ ] Delete listing - shows confirmation dialog, then success toast
- [ ] Invalid email - shows error toast
- [ ] Press Escape - modal closes
- [ ] Filter doctors by country - shows only that country's doctors
- [ ] Filter doctors by city - shows only that city's doctors
- [ ] Listings show "Updated 2 hours ago" format
- [ ] All modals have keyboard shortcut support

---

## Notes
- All 6 modals follow the same pattern - can be done in parallel
- All 3 listing pages follow the same filter pattern
- Remember to add Firestore indexes for country/city filtering
- Toast messages auto-dismiss in 3-4 seconds

Good luck! 🚀
