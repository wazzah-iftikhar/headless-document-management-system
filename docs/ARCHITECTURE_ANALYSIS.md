# Architecture Analysis: Hexagonal (Ports and Adapters)

## Current Architecture Assessment

### ✅ Hexagonal Architecture Elements Present

#### 1. **Domain Layer (Core)**
- **Location**: `src/domain/`
- **Contains**: 
  - Entities (`document.entity.schema.ts`, `user.entity.schema.ts`)
  - Value Objects (`value-objects/`)
  - Domain Services (`document-access.service.ts`)
  - Business Rules (guards, validations)
- **Status**: ✅ Pure domain logic, no infrastructure dependencies

#### 2. **Application Layer (Use Cases)**
- **Location**: `src/application/`
- **Contains**:
  - Use Cases (orchestration)
  - DTOs (application contracts)
  - Error types
- **Status**: ✅ Orchestrates domain services and repositories

#### 3. **Infrastructure Layer (Adapters)**
- **Location**: `src/infrastructure/`
- **Contains**:
  - Repository Implementations (`repositories/implementations/`)
  - Database Schemas (`database/schemas/`)
  - Mappers (`mappers/`)
- **Status**: ✅ Implements outbound ports

#### 4. **Presentation Layer (Adapters)**
- **Location**: `src/presentation/`
- **Contains**:
  - Controllers
  - Routes
  - oRPC Procedures
  - Middleware
- **Status**: ✅ Implements inbound ports

#### 5. **Ports (Interfaces)**
- **Location**: `src/infrastructure/repositories/contracts/`
- **Contains**:
  - `IDocumentRepository`
  - `IUserRepository`
  - `IAccessPolicyRepository`
  - `IDocumentVersionRepository`
- **Status**: ✅ Interfaces defined

---

## ⚠️ Issues Preventing Full Hexagonal Architecture

### Issue 1: Dependency Inversion Violation

**Problem**: Use cases directly instantiate repository implementations instead of depending on interfaces.

**Current Code:**
```typescript
// ❌ Use case depends on concrete implementation
export class CreateDocumentUseCase {
  private documentRepo = new DocumentRepositoryImpl();  // Direct instantiation!
}
```

**Hexagonal Architecture Requires:**
```typescript
// ✅ Use case should depend on interface (port)
export class CreateDocumentUseCase {
  constructor(private documentRepo: IDocumentRepository) {}  // Dependency injection
}
```

**Impact**: 
- Use cases are tightly coupled to infrastructure
- Cannot swap implementations (e.g., SQLite → PostgreSQL) without changing use cases
- Violates Dependency Inversion Principle

### Issue 2: Port Location

**Problem**: Repository contracts (ports) are in infrastructure layer instead of application/domain layer.

**Current Structure:**
```
src/infrastructure/repositories/contracts/  ❌ Ports in infrastructure
```

**Hexagonal Architecture Requires:**
```
src/application/ports/  ✅ Ports should be in application layer
or
src/domain/ports/       ✅ Or in domain layer
```

**Impact**:
- Ports should define what the application needs, not be defined by infrastructure
- Application layer should define its dependencies

### Issue 3: Missing Dependency Injection

**Problem**: No DI container or mechanism to inject dependencies.

**Current**: Direct instantiation in use cases
**Required**: Dependency injection (constructor injection or DI container)

---

## Architecture Comparison

### Current Architecture (Layered Architecture with Some Hexagonal Elements)

```
┌─────────────────────────────────────┐
│   Presentation Layer                │
│   (Controllers, Routes, oRPC)        │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│   Application Layer                  │
│   (Use Cases, DTOs)                  │
│   ❌ Directly instantiates repos     │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│   Domain Layer                       │
│   (Entities, Value Objects, Services)│
└─────────────────────────────────────┘
               │
┌──────────────▼──────────────────────┐
│   Infrastructure Layer                │
│   (Repository Impl, DB, Mappers)     │
│   (Contracts/Ports) ❌ Wrong location │
└─────────────────────────────────────┘
```

### True Hexagonal Architecture (What It Should Be)

```
                    ┌─────────────────────┐
                    │  Presentation        │
                    │  (Inbound Adapter)  │
                    └──────────┬───────────┘
                               │
                    ┌──────────▼───────────┐
                    │  Application        │
                    │  (Use Cases)        │
                    │  ┌───────────────┐  │
                    │  │ Ports (Interfaces)│
                    │  └───────────────┘  │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼───────────┐
                    │  Domain              │
                    │  (Core Business)     │
                    └─────────────────────┘
                               │
                    ┌──────────▼───────────┐
                    │  Infrastructure     │
                    │  (Outbound Adapter) │
                    │  Implements Ports   │
                    └─────────────────────┘
```

---

## Recommendations to Achieve Full Hexagonal Architecture

### 1. Move Ports to Application Layer

**Action**: Move repository contracts from `src/infrastructure/repositories/contracts/` to `src/application/ports/`

**Structure:**
```
src/application/ports/
  - document.repository.port.ts
  - user.repository.port.ts
  - access-policy.repository.port.ts
  - document-version.repository.port.ts
```

### 2. Implement Dependency Injection

**Option A: Constructor Injection**
```typescript
export class CreateDocumentUseCase {
  constructor(private documentRepo: IDocumentRepository) {}
  
  execute(command: CreateDocumentCommand): Effect.Effect<...> {
    // Use this.documentRepo
  }
}
```

**Option B: Effect-TS Dependency Injection (Recommended)**
```typescript
// Use Effect's dependency injection
export class CreateDocumentUseCase {
  execute(command: CreateDocumentCommand): Effect.Effect<
    DocumentResult,
    UseCaseError,
    IDocumentRepository | DatabaseService
  > {
    return pipe(
      Effect.serviceFunction(IDocumentRepository, (repo) => 
        repo.create(...)
      )
    );
  }
}
```

### 3. Update Use Cases to Depend on Ports

**Before:**
```typescript
export class CreateDocumentUseCase {
  private documentRepo = new DocumentRepositoryImpl();  // ❌
}
```

**After:**
```typescript
export class CreateDocumentUseCase {
  constructor(private documentRepo: IDocumentRepository) {}  // ✅
}
```

### 4. Wire Dependencies at Composition Root

**Location**: `src/index.ts` or `src/effect/layers/`

```typescript
// Composition root - wire everything together
const documentRepo = new DocumentRepositoryImpl();
const createDocumentUseCase = new CreateDocumentUseCase(documentRepo);
```

---

## Current Architecture Score

### Hexagonal Architecture Compliance: **70%**

**✅ Present:**
- Domain layer isolated (100%)
- Application layer with use cases (90%)
- Infrastructure adapters (100%)
- Presentation adapters (100%)
- Port interfaces defined (100%)

**❌ Missing:**
- Dependency inversion (0% - direct instantiation)
- Ports in correct layer (0% - ports in infrastructure)
- Dependency injection mechanism (0%)

---

## Conclusion

**Current State**: The project follows a **Layered Architecture** with some hexagonal elements, but **NOT a full Hexagonal Architecture**.

**Key Issues:**
1. Use cases directly instantiate repository implementations
2. Ports are in infrastructure layer instead of application layer
3. No dependency injection mechanism

**To Achieve Full Hexagonal Architecture:**
1. Move ports to application layer
2. Implement dependency injection
3. Update use cases to depend on interfaces
4. Wire dependencies at composition root

The architecture is **well-structured** and **close to hexagonal**, but needs dependency inversion to be fully compliant.
