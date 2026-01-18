# City to Province Refactor Guide

## Summary
All type definitions in `lib/types.ts` have been updated from `city` to `province`.

Started updating modals but due to the scale (9 files total), providing you with the complete pattern.

## Pattern for Each Modal/Page

### Step 1: Replace Imports
```tsx
// OLD
import { Country, City } from "country-state-city";
const COUNTRIES = Country.getAllCountries();

// NEW
import { COUNTRIES } from "@/lib/constants";
import { Country, State } from "country-state-city";
```

### Step 2: Replace State Variable Names
```tsx
// OLD
const [cities, setCities] = useState<any[]>([]);

// NEW
const [provinces, setProvinces] = useState<any[]>([]);
```

### Step 3: Replace Data Initial Values
```tsx
// OLD
city: "Istanbul",

// NEW
province: "Istanbul",
```

### Step 4: Replace useEffect for Loading Provinces
```tsx
// OLD
useEffect(() => {
  if (openData.country) {
    const country = COUNTRIES.find(c => c.name === openData.country);
    if (country) {
      const countryCities = City.getCitiesOfCountry(country.isoCode);
      setCities(countryCities || []);
    } else {
      setCities([]);
    }
  } else {
    setCities([]);
  }
}, [openData.country]);

// NEW
useEffect(() => {
  if (openData.country) {
    const country = COUNTRIES.find(c => c.name === openData.country);
    if (country) {
      const countryProvinces = State.getStatesOfCountry(country.isoCode);
      setProvinces(countryProvinces || []);
    } else {
      setProvinces([]);
    }
  } else {
    setProvinces([]);
  }
}, [openData.country]);
```

### Step 5: Replace UI Dropdowns
```tsx
// OLD
<select 
  value={openData.city || ""} 
  onChange={(e) => setOpenData({...openData, city: e.target.value})} 
  disabled={!openData.country}
>
  <option value="">{openData.country ? "Select City" : "Select Country First"}</option>
  {cities.map((city, idx) => <option key={`${city.name}-${idx}`} value={city.name}>{city.name}</option>)}
</select>

// NEW
<select 
  value={openData.province || ""} 
  onChange={(e) => setOpenData({...openData, province: e.target.value})} 
  disabled={!openData.country}
>
  <option value="">{openData.country ? "Select Province" : "Select Country First"}</option>
  {provinces.map((province, idx) => <option key={`${province.name}-${idx}`} value={province.name}>{province.name}</option>)}
</select>
```

### Step 6: Replace Country Selection Reset
```tsx
// OLD
onChange={(e) => setOpenData({...openData, country: e.target.value, city: ""})}

// NEW
onChange={(e) => setOpenData({...openData, country: e.target.value, province: ""})}
```

## Files to Update

### Admin Listing CRUD Modals (3)
- [x] `app/admin/components/HealthcarePersonnelListingCRUDModal.tsx` (renamed from OpenHealthcarePersonnelModal.tsx) - ✅ DONE
- [x] `app/admin/components/MedicalFacilityListingCRUDModal.tsx` (renamed from OpenMedicalFacilityModal.tsx) - ✅ DONE
- [x] `app/admin/components/AgencyListingCRUDModal.tsx` (renamed from OpenAgencyModal.tsx) - ✅ DONE

### User CRUD Modal (1)
- [x] `app/admin/components/user-data/UserCRUDModal.tsx` (renamed from UserModal.tsx) - Handles ALL user roles dynamically

### Deprecated User Modals (3) - Should be removed
- [ ] `app/admin/components/user-data/HealthcarePersonnelUserModal.tsx` - Use UserCRUDModal instead
- [ ] `app/admin/components/user-data/MedicalFacilityUserModal.tsx` - Use UserCRUDModal instead
- [ ] `app/admin/components/user-data/AgencyUserModal.tsx` - Use UserCRUDModal instead

### Pages (4)
- [ ] `app/profile/page.tsx` (3 sections)
- [ ] `app/doctors/page.tsx` - Add province filter
- [ ] `app/medical-facilities/page.tsx` - Add province filter
- [ ] `app/agencies/page.tsx` - Add province filter

## Quick Search/Replace Commands

In VS Code, use Find and Replace (Ctrl+H):

1. `city:` → `province:` (in state initialization)
2. `city"` → `province"` (in property names)
3. `setCities` → `setProvinces` (state setter)
4. `cities.map` → `provinces.map` (rendering)
5. `City.getCities` → `State.getStates` (API call)
6. `Select City` → `Select Province` (labels)
7. `openData.city` → `openData.province` (property access)

## Important Notes

- `State.getStatesOfCountry(isoCode)` returns objects with `name` and `isoCode` properties (same as City)
- Some countries may have no states/provinces - the array will be empty, so the dropdown will just show the placeholder
- For countries without state data (like Turkey), users might want to use "address" field for detail
- After updates, build will catch any missed references

## Testing Checklist
- [ ] Create new listing with valid country + province
- [ ] Edit listing and change country (province should reset)
- [ ] Province dropdown only enables after country selected
- [ ] Listing page filters work with new province field
- [ ] Profile page saves province correctly
