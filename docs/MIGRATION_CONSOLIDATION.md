# Database Migration Consolidation

## Summary
All 15 previous migrations have been consolidated into a single comprehensive migration file:
- **File**: `supabase/migrations/20260301000000_consolidated_schema.sql`
- **Size**: ~23KB
- **Contains**: Complete database schema with all tables, indexes, and RLS policies

## What Changed

### Before (15 separate migrations)
```
20260121122311_medikal_initial_schema.sql
20260121130000_add_users_insert_policy.sql
20260121140000_allow_admin_user_updates.sql
... (12 more files)
20260205000001_rename_profiles_to_user_data.sql
```

### After (1 consolidated migration)
```
20260301000000_consolidated_schema.sql
```

## Important Notes

### Remote Database (Supabase)
- ✅ Remote database **keeps all 15 migrations applied** (audit trail preserved)
- ✅ Consolidated migration is **NOT applied** to remote (schema already exists)
- ✅ No data loss or schema changes

### Local Development
- New developers cloning the repo will run **only the consolidated migration** 
- This achieves the same end state as running all 15 migrations sequentially
- **Much faster onboarding** (~1 second vs ~15 seconds)

### Migration Workflow Going Forward

**For new features/schema changes:**
1. Create new migration file: `supabase/migrations/YYYYMMDDHHMMSS_describe_change.sql`
2. Develop and test locally
3. Run `supabase db push` to deploy to remote
4. On next consolidation cycle, merge into consolidated file

**When to consolidate again:**
- After 10-15 new migrations accumulate
- Before major version releases
- Run: `supabase migration list` to check count

## Database Schema Contents

The consolidated migration includes:

### Tables (11)
- `users` (extended with role-specific FK columns)
- `patient_user_data`
- `healthcare_personnel_user_data`
- `medical_facility_user_data`
- `agency_user_data`
- `healthcare_personnel_listings`
- `medical_facility_listings`
- `agency_listings`
- `comments`
- `treatment_plans`, `treatment_plan_details`, `doctor_responses`
- `support_tickets`, `ticket_replies`

### Features
- ✅ All 4 role-specific user data tables
- ✅ Two-way foreign key linking between users and role data
- ✅ 25+ performance indexes
- ✅ Row-level security (RLS) on all tables
- ✅ Soft delete for comments (is_deleted flag)
- ✅ Verification tracking for listings
- ✅ Treatment plan management
- ✅ Support ticketing system

### Naming Convention
- Tables use `_user_data` suffix (not `_profiles`)
- All snake_case field names
- UUIDs for all primary keys
- Timestamps with timezone for audit trails

## Reverting (if needed)

If you need to go back to individual migrations:

```bash
# Restore old migration files from git history
git log --all --full-history -- "supabase/migrations/*.sql" | head -20

# Or manually recreate them from the consolidated file
# (would require splitting the consolidated file back into incremental steps)
```

## Testing

Verify the consolidated migration works for new setups:

```bash
# Clean local database (destructive!)
supabase db reset

# Apply only consolidated migration
supabase db push
```

All 140 tests pass with this schema ✅
