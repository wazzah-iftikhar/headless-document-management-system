# Architecture Status: Old vs New

## Current State: **App is using OLD architecture** ❌

### What the App Currently Uses:

#### 1. **Old Database Schema** (`src/models/`)
- ✅ Integer auto-increment IDs (`id: integer().primaryKey({ autoIncrement: true })`)
- ✅ Simple table definitions
- ✅ No domain entities or value objects
- ✅ Direct Drizzle models

**Files:**
- `src/models/document.model.ts` - Old schema with integer IDs
- `src/models/download-token.model.ts` - Old schema
- `src/config/database.ts` - Uses `../models` schema

#### 2. **Old Repository Pattern** (`src/repositories/`)
- ✅ Uses old models from `../models`
- ✅ Integer IDs (`id: number`)
- ✅ No pagination support
- ✅ Basic CRUD operations

**Files:**
- `src/repositories/document.repository.ts` - Old repository
- `src/services/document.service.ts` - **Imports from `../repositories`** (OLD)

#### 3. **Old Database Initialization** (`src/config/init-db.ts`)
- ✅ Manual SQL table creation
- ✅ No migrations
- ✅ Integer primary keys

---

## New Architecture: **Created but NOT integrated** ✅

### What We Built (Ready but Unused):

#### 1. **Domain Layer** (`src/domain/`)
- ✅ Domain entities with value objects
- ✅ Document, User, AccessPolicy, DocumentVersion entities
- ✅ Value objects (DocumentIdVO, EmailVO, RoleVO, etc.)
- ✅ Domain services (DocumentAccessService)
- ✅ Schema-first approach with Effect/Schema

**Location:** `src/domain/`

#### 2. **Infrastructure Layer** (`src/infrastructure/`)
- ✅ New Drizzle schemas with UUIDs (`src/infrastructure/database/schemas/`)
- ✅ Repository implementations (`src/infrastructure/repositories/implementations/`)
- ✅ Mappers between domain and persistence (`src/infrastructure/mappers/`)
- ✅ Database migrations (`drizzle/` folder)
- ✅ Seed generators for testing

**Location:** `src/infrastructure/`

#### 3. **New Features Available:**
- ✅ UUID v4 primary keys
- ✅ Pagination support
- ✅ Proper domain entities
- ✅ Value objects for type safety
- ✅ Comprehensive error handling
- ✅ Index optimization
- ✅ Migration system

---

## Comparison Table

| Feature | Old Architecture | New Architecture |
|---------|-----------------|------------------|
| **IDs** | Integer auto-increment | UUID v4 |
| **Schemas** | `src/models/` | `src/infrastructure/database/schemas/` |
| **Repositories** | `src/repositories/` | `src/infrastructure/repositories/implementations/` |
| **Domain Layer** | ❌ None | ✅ Complete (`src/domain/`) |
| **Value Objects** | ❌ None | ✅ Complete |
| **Pagination** | ❌ None | ✅ Supported |
| **Migrations** | ❌ Manual SQL | ✅ Drizzle migrations |
| **Mappers** | ❌ None | ✅ Domain ↔ Persistence |
| **Currently Used** | ✅ **YES** | ❌ **NO** |

---

## What Needs to Happen to Use New Architecture:

### Step 1: Update Services
- Change `DocumentService` to use `DocumentRepositoryImpl` instead of `DocumentRepository`
- Update imports from `../repositories` to `../infrastructure/repositories/implementations`
- Use mappers to convert between domain and persistence types

### Step 2: Update Database Service
- Update `DatabaseService` to use new schemas from `src/infrastructure/database/schemas/`
- Remove old `src/config/database.ts` or update it

### Step 3: Update Controllers
- Handle UUID strings instead of integers
- Use domain entities instead of model types
- Update response types

### Step 4: Database Migration
- Run migrations to create new tables
- Migrate existing data (if any) from integer IDs to UUIDs
- Update `init-db.ts` to use migrations instead of manual SQL

### Step 5: Update Routes
- Change ID parameters from `number` to `string` (UUID)
- Add pagination query parameters (`?page=1&limit=10`)

---

## Current Import Chain:

```
Controller → Service → OLD Repository → OLD Models → OLD Database
```

## Desired Import Chain:

```
Controller → Service → NEW Repository → Mapper → Domain Entity
                                      ↓
                              Persistence Type → NEW Database Schema
```

---

## Recommendation:

**Option 1: Gradual Migration** (Recommended)
- Keep old code working
- Create new endpoints alongside old ones
- Migrate one feature at a time
- Test thoroughly at each step

**Option 2: Complete Migration**
- Update all services at once
- Requires database migration
- More risk, but cleaner result

Would you like me to help migrate the services to use the new architecture?
