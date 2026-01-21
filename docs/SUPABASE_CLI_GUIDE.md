# Supabase CLI: Complete Guide for Medikal Site

Based on official Supabase documentation: https://supabase.com/docs/reference/cli/start

---

## 📋 Table of Contents
1. [Installation](#installation)
2. [Authentication](#authentication)
3. [Local Development](#local-development)
4. [Database Management](#database-management)
5. [Migrations](#migrations)
6. [Deployment to Production](#deployment-to-production)
7. [Edge Functions](#edge-functions)
8. [Database Inspection](#database-inspection)
9. [Project Management](#project-management)
10. [Advanced Features](#advanced-features)

---

## ⚙️ Installation

### Prerequisites
- Node.js 16+ or Deno
- Docker Desktop (for local development)
- Git

### Install Supabase CLI
```bash
npm install -g supabase
```

### Verify Installation
```bash
supabase --version
```

---

## 🔐 Authentication

### 1. Login to Supabase
Generate a personal access token first:
1. Go to https://supabase.com/dashboard/account/tokens
2. Create a new token with appropriate permissions

```bash
supabase login
```

**Prompt:** You'll be asked to enter your access token
```
Enter your access token: sbp_********...
Finished supabase login.
```

### Alternative: Environment Variable (for CI/CD)
```bash
export SUPABASE_ACCESS_TOKEN=sbp_your_token_here
supabase projects list  # No login prompt
```

### Token Storage
- **Default:** Stored securely in native credentials storage (system keyring)
- **Fallback:** Plain text file at `~/.supabase/access-token` (if no keyring available)

**⚠️ Security:** Never commit your access token. Use environment variables in CI/CD pipelines.

---

## 🚀 Local Development

### Initialize Local Project
```bash
supabase init
```

**Output:** Creates `supabase/config.toml` with project configuration

**Optional Flags:**
- `--force` - Overwrite existing config
- `-i, --interactive` - Interactive configuration mode
- `--use-orioledb` - Use OrioleDB storage engine (PostgreSQL alternative)

### Start Local Development Stack
```bash
supabase start
```

**What it does:**
- Starts PostgreSQL database
- Starts Auth service (GoTrue)
- Starts PostgREST API server
- Starts Realtime service
- Starts Storage API
- Starts Supabase Studio (local dashboard)
- Applies all migrations in `supabase/migrations/`
- Runs seed data from `supabase/seed.sql`

**Output Example:**
```
Creating custom roles supabase/roles.sql...
Applying migration 20220810154536_employee.sql...
Seeding data supabase/seed.sql...
Started supabase local development setup.

API URL: http://127.0.0.1:54321
GraphQL URL: http://127.0.0.1:54321/graphql/v1
DB URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres
Studio URL: http://127.0.0.1:54323
Inbucket URL: http://127.0.0.1:54324
JWT secret: super-secret-jwt-token-with-at-least-32-characters-long

anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Requirements:**
- Minimum 7GB RAM for all services
- Docker Desktop running

**Exclude Services (optional):**
```bash
supabase start -x imgproxy,studio
# Available: gotrue, realtime, storage-api, imgproxy, kong, mailpit, postgrest, postgres-meta, studio, edge-runtime, logflare, vector, supavisor
```

### Stop Local Stack
```bash
supabase stop
```

**Flags:**
- `--all` - Stop all local Supabase instances (across all projects)
- `--no-backup` - Delete all data (useful for reset)
- `--project-id <id>` - Stop specific project

### Check Local Stack Status
```bash
supabase status
```

**Output:** Shows all service URLs and credentials

**Export as Environment Variables:**
```bash
supabase status -o env
# Exports: JWT_SECRET, ANON_KEY, SERVICE_ROLE_KEY
```

---

## 🗄️ Database Management

### Link to Remote Project
```bash
supabase link --project-ref your_project_ref
```

**What it does:**
- Connects local project to a hosted Supabase project
- Fetches PostgREST configurations
- Validates against local config

**Flags:**
- `--project-ref <string>` - Project reference
- `-p, --password <string>` - Database password (optional, will prompt if needed)
- `--skip-pooler` - Use direct connection instead of pooler

**For CI/CD (skip password prompt):**
```bash
export SUPABASE_DB_PASSWORD=your_password
supabase link --project-ref abc123
```

### Push Migrations to Remote
```bash
supabase db push
```

**Purpose:** Deploy all local migrations to your hosted database

**First Run:**
1. Creates migration history table: `supabase_migrations.schema_migrations`
2. Applies all pending migrations
3. Records each applied migration with timestamp

**Subsequent Runs:**
- Only applies migrations that haven't been applied yet
- Skips already-applied migrations

**Flags:**
- `--dry-run` - Preview migrations without applying
- `--linked` - Push to linked remote project
- `--local` - Push to local database
- `--db-url <string>` - Push to self-hosted database
- `--include-all` - Include migrations not in remote history table
- `--include-roles` - Include custom roles from `supabase/roles.sql`
- `--include-seed` - Include seed data from config

**Example - Safe Deployment:**
```bash
supabase db push --dry-run  # Preview changes
supabase db push            # Actually deploy
```

### Pull Schema from Remote
```bash
supabase db pull
```

**Purpose:** Capture remote database schema as a new migration file

**When to use:**
- After making schema changes in Supabase dashboard
- When remote and local schemas are out of sync
- To sync team changes made by others

**Requirements:**
- Must have Docker running
- Must be linked to a remote project

**Output:**
```
Connecting to remote database...
Schema written to supabase/migrations/20240414044403_remote_schema.sql
Update remote migration history table? [Y/n]
Repaired migration history: [20240414044403] => applied
```

**Exclude Schemas:**
```bash
supabase db pull --schema auth,storage
```

**Common Schemas:**
- `public` - Your custom tables
- `auth` - Authentication tables (excluded by default)
- `storage` - File storage tables (excluded by default)

### Reset Local Database
```bash
supabase db reset
```

**What it does:**
1. Drops all user-created entities
2. Recreates PostgreSQL container
3. Re-applies all migrations from `supabase/migrations/`
4. Re-runs seed data from `supabase/seed.sql`

**Flags:**
- `--local` - Reset local database
- `--linked` - Reset remote linked project
- `--version <string>` - Reset to specific migration version
- `--last <uint>` - Reset up to last N migrations
- `--no-seed` - Skip running seed script

**Warning:** All unsaved changes will be lost!

```bash
supabase db reset --no-seed  # Skip seed data
```

### Dump Database Schema
```bash
supabase db dump -f supabase/schema.sql
```

**Flags:**
- `-f, --file <string>` - Save to specific file
- `--data-only` - Dump only data records
- `--role-only` - Dump only cluster roles
- `--use-copy` - Use COPY statements instead of INSERT
- `--exclude <strings>` - Exclude specific schema.tables
- `--schema <strings>` - Include only specific schemas

**Examples:**
```bash
# Dump schema and data
supabase db dump -f backup.sql

# Data only (for seeding)
supabase db dump --data-only -f seed.sql

# Role definitions only
supabase db dump --role-only -f roles.sql
```

### Diff Local vs Remote
```bash
supabase db diff
```

**Purpose:** Compare local migrations against actual remote database

**Flags:**
- `--linked` - Diff against linked project
- `--local` - Diff against local database
- `--schema <strings>` - Diff specific schemas only
- `-f, --file <string>` - Save diff as new migration

**Known Limitations:**
- Can't diff changes to publications
- Can't diff storage bucket changes
- Can't diff views with `security_invoker` attributes

**Example - Create Migration from Diff:**
```bash
supabase db diff -f my_changes
# Creates: supabase/migrations/20240101120000_my_changes.sql
```

### Lint Database Schema
```bash
supabase db lint
```

**Purpose:** Validate database schema for errors using `plpgsql_check` extension

**Flags:**
- `--level <[ warning | error ]>` - Set error level (default: warning)
- `--fail-on <[ none | warning | error ]>` - When to exit with non-zero status
- `--schema <strings>` - Lint specific schemas

**Example - CI/CD Integration:**
```bash
supabase db lint --fail-on error
# Exits with error code 1 if errors found
```

---

## 🔄 Migrations

### Create New Migration
```bash
supabase migration new <migration_name>
```

**Output:**
```
Created new migration at supabase/migrations/20230306095710_schema_test.sql.
```

**Pattern:** `<timestamp>_<name>.sql`
- Timestamp: Auto-generated (YYYYMMDDhhmmss)
- Name: Your description (snake_case)

**Example:**
```bash
supabase migration new add_users_table
# Creates: supabase/migrations/20240121150000_add_users_table.sql
```

### Pipe Output to Migration
```bash
supabase db diff -f new_changes | supabase migration new my_migration_name
```

### List Migration History
```bash
supabase migration list
```

**Output:**
```
LOCAL      │     REMOTE     │     TIME (UTC)
─────────────────┼────────────────┼──────────────────────
                 │ 20230103054303 │ 2023-01-03 05:43:03
                 │ 20230103093141 │ 2023-01-03 09:31:41
  20230222032233 │                │ 2023-02-22 03:22:33
```

**Flags:**
- `--linked` - Show linked project migrations
- `--local` - Show local database migrations
- `--db-url <string>` - Show migrations from self-hosted DB

### Apply Pending Migrations
```bash
supabase migration up
```

**Flags:**
- `--linked` - Apply to linked project
- `--local` - Apply to local database
- `--include-all` - Include migrations not in history table

### Revert Migrations
```bash
supabase migration down
```

**Flags:**
- `--last <uint>` - Revert last N migrations
- `--version <string>` - Revert to specific version
- `--linked` - Revert linked project

### Repair Migration History
```bash
supabase migration repair 20230103054303 --status applied
```

**When to use:**
- When local and remote migration history goes out of sync
- To mark migrations as applied/reverted without re-running them

**Flags:**
- `--status <[ applied | reverted ]>` - Mark as applied or reverted
- `--linked` - Repair linked project

**Example - Sync Out-of-Sync Migrations:**
```bash
# Current state:
# LOCAL:  20230103054315
# REMOTE: 20230103054303

# Delete local file
rm supabase/migrations/20230103054315_remote_commit.sql

# Mark remote as reverted
supabase migration repair 20230103054303 --status reverted

# Pull remote schema as new migration
supabase db pull
```

### Squash Multiple Migrations
```bash
supabase migration squash
```

**Purpose:** Combine many migrations into one clean file

**Benefits:**
- Cleaner migration history
- Faster deployments
- Easier to understand schema evolution

**Limitations:**
- Data manipulation (INSERT, UPDATE, DELETE) are omitted
- Must manually re-add cron jobs, storage buckets, secrets

**Flags:**
- `--version <string>` - Squash up to specific migration

---

## 🚀 Deployment to Production

### Complete Workflow

#### Step 1: Prepare Local Changes
```bash
supabase migration new add_new_table
# Edit supabase/migrations/[timestamp]_add_new_table.sql

supabase db push --local  # Test locally
```

#### Step 2: Link to Remote Project
```bash
supabase link --project-ref your-project-id
```

#### Step 3: Preview Changes
```bash
supabase db push --dry-run
```

#### Step 4: Deploy
```bash
supabase db push
```

#### Step 5: Verify
```bash
supabase db diff --linked  # Should show "No schema changes found"
```

### Production Best Practices

1. **Always test locally first**
   ```bash
   supabase start
   supabase db reset  # Clean slate
   supabase db push --local
   ```

2. **Preview before deploying**
   ```bash
   supabase db push --dry-run
   ```

3. **Use version control**
   - Commit all migration files
   - Use git tags for releases
   - Review migration diffs in PRs

4. **Backup before major changes**
   ```bash
   supabase db dump -f backup-$(date +%Y%m%d).sql
   ```

5. **Monitor after deployment**
   ```bash
   supabase db lint --fail-on error
   supabase inspect db bloat
   supabase inspect db vacuum-stats
   ```

---

## ⚡ Edge Functions

### Create New Function
```bash
supabase functions new hello
```

**Creates:**
```
supabase/functions/hello/index.ts
```

**With boilerplate:**
```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

console.log("Hello from Functions!")

serve(async (req) => {
  const { name } = await req.json()
  const data = {
    message: `Hello ${name}!`,
  }

  return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json" } })
})
```

### Serve Functions Locally
```bash
supabase functions serve
```

**Output:**
```
Serving Functions on http://127.0.0.1:54321/functions/v1
```

**Debugging:**
```bash
# Breakpoint on first line
supabase functions serve --inspect-mode brk

# Pause until debugger connects
supabase functions serve --inspect-mode wait

# Allow debugging main worker
supabase functions serve --inspect-mode run --inspect-main
```

### Deploy Function
```bash
supabase functions deploy hello
```

**Flags:**
- `--project-ref <string>` - Deploy to specific project
- `--no-verify-jwt` - Disable JWT verification
- `--prune` - Delete remote functions not in local code

### List Functions
```bash
supabase functions list
```

### Download Function
```bash
supabase functions download hello
```

### Delete Function
```bash
supabase functions delete hello
```

---

## 🔍 Database Inspection

### Bloat Analysis
```bash
supabase inspect db bloat
```

**Purpose:** Find tables with excessive "dead tuples" from UPDATEs/DELETEs

**Output Shows:**
- Table name
- Bloat percentage
- Wasted space (in MB/GB)

**Action:** High bloat → Run VACUUM manually or adjust autovacuum settings

### Long-Running Queries
```bash
supabase inspect db long-running-queries
```

**Purpose:** Find queries running longer than 5 minutes

**Output:**
```
PID │ DURATION      │ QUERY
───────┼──────────────────┼─────────────...
19578 │ 02:29:11.200129 │ SELECT ...
```

### Query Performance (Outliers)
```bash
supabase inspect db outliers
```

**Purpose:** Find slowest queries by total execution time

**Output Shows:**
- Query text
- Total execution time
- % of total database time
- Number of calls
- Sync I/O time (disk wait)

**Use Case:** Identify queries to optimize/index

### Index Statistics
```bash
supabase inspect db index-stats
```

**Purpose:** Show index usage and performance

### Table Statistics
```bash
supabase inspect db table-stats
```

### Database Locks
```bash
supabase inspect db locks
```

**Purpose:** Find queries holding exclusive locks

**When to use:** Debugging "hung" transactions

### Blocking Queries
```bash
supabase inspect db blocking
```

**Purpose:** Show which query is blocking which

### Query Calls (Most Frequent)
```bash
supabase inspect db calls
```

**Purpose:** Find most-called queries (good optimization candidates)

### Replication Slots
```bash
supabase inspect db replication-slots
```

**Purpose:** Monitor logical replication status and lag

### Vacuum Statistics
```bash
supabase inspect db vacuum-stats
```

**Purpose:** Check if autovacuum is keeping up

**Output Shows:**
- Last vacuum time
- Last autovacuum time
- Row count
- Dead row count
- Expected autovacuum status

### Traffic Profile
```bash
supabase inspect db traffic-profile
```

**Purpose:** Analyze read/write ratios for workload classification

**Categories:**
- **Read-Heavy:** Reads > 5x writes
- **Write-Heavy:** Writes > 20% of reads
- **Balanced:** Mixed workload
- **Read-Only:** Only reads
- **Write-Only:** Only writes

### Generate Report
```bash
supabase inspect report --output-dir ./reports
```

**Output:** CSV files with all database statistics

---

## 📦 Project Management

### List Your Projects
```bash
supabase projects list
```

**Output:**
```
ID              │ NAME                    │ ORGANIZATION
────────────────┼─────────────────────────┼──────────────
abc123xyz       │ my-project              │ my-org
```

### Create New Project
```bash
supabase projects create my-new-project
```

**Flags:**
- `--org-id <string>` - Organization to create in
- `--region <string>` - Region (e.g., us-east-1, eu-west-1)
- `--size <string>` - Instance size
- `--db-password <string>` - Database password

### Get Project API Keys
```bash
supabase projects api-keys --project-ref your-project-id
```

### Delete Project
```bash
supabase projects delete your-project-id
```

---

## 🏢 Organization Management

### List Organizations
```bash
supabase orgs list
```

### Create Organization
```bash
supabase orgs create
```

---

## 🔑 Secrets Management

### Set Secret
```bash
supabase secrets set API_KEY=secret_value
```

**From .env file:**
```bash
supabase secrets set --env-file .env.local
```

### List Secrets
```bash
supabase secrets list
```

### Unset Secret
```bash
supabase secrets unset API_KEY
```

**Usage in Edge Functions:**
```typescript
const apiKey = Deno.env.get("API_KEY")
```

---

## 📂 Storage Management

### List Storage Objects
```bash
supabase storage ls s3:///my-bucket --experimental
```

### Upload File
```bash
supabase storage cp -r ./local/path s3:///bucket-name --experimental
```

### Download File
```bash
supabase storage cp s3:///bucket-name/file ./local/path --experimental
```

### Move File
```bash
supabase storage mv s3:///bucket1/file s3:///bucket2/file --experimental
```

### Delete File
```bash
supabase storage rm s3:///bucket-name/file --experimental
```

---

## 🧪 Testing

### Run pgTAP Tests (Local)
```bash
supabase test db
```

**Requirements:**
- Test files in `supabase/tests/` directory
- `.sql` or `.pg` extension
- pgTAP framework

### Run Tests on Linked Project
```bash
supabase test db --linked
```

### Create New Test
```bash
supabase test new my_test --template pgtap
```

---

## 📝 Type Generation

### Generate TypeScript Types
```bash
supabase gen types typescript --linked > types/supabase.ts
```

**Flags:**
- `--lang <[ typescript | go | swift | python ]>` - Output language
- `--linked` - Generate from linked project
- `--local` - Generate from local database
- `--schema <strings>` - Include specific schemas
- `--postgrest-v9-compat` - Compatibility with older PostgREST

**Example - All Types:**
```bash
supabase gen types typescript --linked --schema public,auth > types/database.ts
```

### Generate JWT Signing Key
```bash
supabase gen bearer-jwt
```

### Generate Signing Key
```bash
supabase gen signing-key --algorithm ES256
```

**Algorithms:**
- `ES256` - ECDSA (recommended)
- `RS256` - RSA

---

## 🌿 Preview Branches

### Create Branch
```bash
supabase branches create branch-name
```

**Flags:**
- `--with-data` - Clone production data
- `--persistent` - Keep branch permanently (vs ephemeral)
- `--region <string>` - Region for branch
- `--size <string>` - Instance size

### List Branches
```bash
supabase branches list
```

### Get Branch Details
```bash
supabase branches get branch-name
```

### Update Branch
```bash
supabase branches update branch-name --name new-name
```

### Pause Branch
```bash
supabase branches pause branch-name
```

### Unpause Branch
```bash
supabase branches unpause branch-name
```

### Delete Branch
```bash
supabase branches delete branch-name
```

---

## 🔒 Advanced Features

### SSO (SAML)
```bash
# Add identity provider
supabase sso add --type saml --metadata-url https://... --domains company.com

# List providers
supabase sso list

# Show provider details
supabase sso show <provider-id>

# Update provider
supabase sso update <provider-id> --domains new-company.com

# Remove provider
supabase sso remove <provider-id>

# Get SSO info for your Okta/Active Directory
supabase sso info
```

### Custom Domains
```bash
# Create custom domain
supabase domains create --custom-hostname api.mycompany.com

# Check domain config
supabase domains get

# Activate domain
supabase domains activate

# Re-verify domain
supabase domains reverify

# Delete domain
supabase domains delete
```

### Vanity Subdomains
```bash
# Check availability
supabase vanity-subdomains check-availability --desired-subdomain myapp --experimental

# Activate subdomain
supabase vanity-subdomains activate --desired-subdomain myapp --experimental

# Get current subdomain
supabase vanity-subdomains get --experimental

# Delete subdomain
supabase vanity-subdomains delete --experimental
```

### Network Restrictions
```bash
# View restrictions
supabase network-restrictions get --experimental

# Update restrictions
supabase network-restrictions update --db-allow-cidr 192.168.1.0/24 --experimental
```

### SSL Enforcement
```bash
# Get SSL status
supabase ssl-enforcement get --experimental

# Enable SSL enforcement
supabase ssl-enforcement update --enable-db-ssl-enforcement --experimental

# Disable SSL enforcement
supabase ssl-enforcement update --disable-db-ssl-enforcement --experimental
```

### Network Bans
```bash
# View current bans
supabase network-bans get --experimental

# Remove IP from ban list
supabase network-bans remove --db-unban-ip 192.168.1.1 --experimental
```

### Postgres Config
```bash
# View current config overrides
supabase postgres-config get --experimental

# Update config
supabase postgres-config update --config "max_connections=500" --experimental

# Delete config override
supabase postgres-config delete --config max_connections --experimental
```

---

## 🎯 Global Flags (Work with ALL Commands)

| Flag | Type | Description |
|------|------|-------------|
| `--debug` | boolean | Output debug logs |
| `--help` / `-h` | boolean | Show command help |
| `--output` / `-o` | string | Output format: env, pretty, json, toml, yaml |
| `--profile <string>` | string | Use specific Supabase API profile |
| `--workdir <string>` | string | Path to Supabase project directory |
| `--yes` | boolean | Answer yes to all prompts |
| `--experimental` | boolean | Enable experimental features |
| `--dns-resolver` | string | native or https DNS resolution |
| `--network-id <string>` | string | Docker network ID |
| `--create-ticket` | boolean | Create support ticket on error |

**Examples:**
```bash
# Pretty JSON output
supabase status -o json | jq

# Debug mode
supabase start --debug

# Skip all prompts
supabase db push --yes

# Specific workdir
supabase init --workdir /path/to/project
```

---

## 📚 Shell Autocomplete

### Bash
```bash
supabase completion bash > /etc/bash_completion.d/supabase
source /etc/bash_completion.d/supabase
```

### Zsh
```bash
supabase completion zsh > "${fpath[1]}/_supabase"
```

### Fish
```bash
supabase completion fish > ~/.config/fish/completions/supabase.fish
```

### PowerShell
```powershell
supabase completion powershell | Out-String | Invoke-Expression
```

---

## 🚦 CI/CD Integration

### GitHub Actions
```yaml
name: Deploy Database

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Install Supabase CLI
        run: npm install -g supabase
      
      - name: Link project
        run: supabase link --project-ref ${{ secrets.SUPABASE_PROJECT_ID }}
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
          SUPABASE_DB_PASSWORD: ${{ secrets.SUPABASE_DB_PASSWORD }}
      
      - name: Deploy migrations
        run: supabase db push
```

### Environment Variables (CI/CD)
```bash
export SUPABASE_ACCESS_TOKEN=sbp_your_token
export SUPABASE_DB_PASSWORD=your_password
export SUPABASE_PROJECT_ID=your_project_id

supabase db push  # Runs without prompts
```

---

## ⚠️ Common Issues & Solutions

### Issue: "Docker not running"
```bash
# Solution: Start Docker Desktop or Docker daemon
docker ps  # Verify Docker is running
```

### Issue: "Migration already applied"
```bash
# Solution: Use migration repair
supabase migration repair 20240101120000 --status reverted
supabase migration repair 20240101120000 --status applied
```

### Issue: Local and remote out of sync
```bash
# Solution: Pull remote schema as migration
supabase db pull  # Captures remote schema
supabase db push  # Syncs to local
```

### Issue: Can't connect to remote database
```bash
# Check credentials
supabase link --project-ref your-project-id

# Verify password
echo $SUPABASE_DB_PASSWORD  # Should not be empty

# Try self-hosted with URL
supabase db push --db-url postgresql://user:pass@host/dbname
```

### Issue: Function deployment fails
```bash
# Check for errors
supabase functions serve --debug

# Verify function syntax
supabase functions deploy hello --dry-run  # If available
```

---

## 📞 Help & Support

```bash
# General help
supabase --help

# Command-specific help
supabase db --help
supabase migration --help
supabase functions --help

# Version info
supabase --version

# Create support ticket for CLI errors
supabase db push --create-ticket
```

**Official Docs:** https://supabase.com/docs/guides/local-development/cli/getting-started  
**GitHub Issues:** https://github.com/supabase/cli/issues  
**Discord:** https://discord.supabase.com/

---

## 🎓 Workflow Examples

### Local Development Workflow
```bash
# 1. Initialize project
supabase init

# 2. Start local stack
supabase start

# 3. Create migrations
supabase migration new add_users_table
# Edit the SQL file

# 4. Test locally
supabase db reset
# Test your app

# 5. When ready, link to production
supabase link --project-ref prod-project-id

# 6. Preview changes
supabase db push --dry-run

# 7. Deploy
supabase db push
```

### Collaborative Development
```bash
# Developer 1: Make schema changes
supabase migration new add_columns
supabase db reset  # Test locally
git add supabase/migrations
git commit -m "Add new columns to users table"
git push

# Developer 2: Pull changes
git pull
supabase db reset  # Apply new migrations
# Continue development

# Deploy to production
supabase link --project-ref prod-id
supabase db push --dry-run
supabase db push
```

### Disaster Recovery
```bash
# 1. Backup current schema
supabase db dump -f backup-$(date +%Y%m%d-%H%M%S).sql

# 2. Check what went wrong
supabase db diff --linked

# 3. Create rollback migration
supabase migration new rollback_bad_migration
# Edit SQL to undo changes

# 4. Test rollback locally
supabase db reset

# 5. Deploy rollback
supabase db push --dry-run
supabase db push
```

---

**Last Updated:** January 2026  
**Supabase CLI Version:** Consistent with latest v1+ release  
**Project:** Medikal Site (Firebase → Supabase Migration)
