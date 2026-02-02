# Utils Folder Reorganization Guide

This document outlines where files from `src/utils/` should be moved according to hexagonal architecture principles.

## Current Structure Analysis

Files in `src/utils/`:
1. `logger.ts` - Structured logging service
2. `jwt.ts` - JWT token signing/verification service
3. `file.utils.ts` - File validation and operations
4. `token.ts` - Token generation utility
5. `result.ts` - Result type utility
6. `safe-parse.ts` - Safe JSON parsing utility
7. `validation.utils.ts` - Validation utilities

## Recommended Organization

### 1. Infrastructure Services → `src/infrastructure/services/`

These are infrastructure concerns (external dependencies, cross-cutting concerns):

#### `logger.ts` → `src/infrastructure/services/logger.service.ts`
- **Reason**: Observability/infrastructure concern
- **Used by**: All layers (presentation, application, infrastructure)
- **Dependencies**: None (pure infrastructure service)

#### `jwt.ts` → `src/infrastructure/services/jwt.service.ts`
- **Reason**: Security/infrastructure concern
- **Used by**: Presentation layer (middleware, context extractors)
- **Dependencies**: `@elysiajs/jwt` (external library)

#### `file.utils.ts` → `src/infrastructure/services/file.service.ts`
- **Reason**: File system operations are infrastructure
- **Used by**: Application layer (use cases)
- **Dependencies**: Effect-TS, ConfigService
- **Note**: Could potentially merge with `src/effect/services/filesystem.service.ts` if they serve similar purposes

#### `token.ts` → `src/infrastructure/services/token.service.ts`
- **Reason**: Token generation is infrastructure/security concern
- **Used by**: Application layer (use cases)
- **Dependencies**: `crypto` (Node.js built-in)

### 2. Shared Utilities → Keep in `src/utils/` or `src/shared/`

These are pure utility functions with no dependencies:

#### `result.ts` → Keep in `src/utils/` OR move to `src/shared/types/`
- **Reason**: Shared utility type, no dependencies
- **Used by**: Multiple layers
- **Option A**: Keep in `src/utils/` (acceptable for shared utilities)
- **Option B**: Move to `src/shared/types/result.ts` (if you want a dedicated shared folder)

#### `safe-parse.ts` → Keep in `src/utils/` OR move to `src/shared/utils/`
- **Reason**: Pure utility function, no dependencies
- **Used by**: Potentially multiple layers
- **Option A**: Keep in `src/utils/` (acceptable)
- **Option B**: Move to `src/shared/utils/safe-parse.ts`

### 3. Application/Presentation Utilities

#### `validation.utils.ts` → `src/application/utils/validation.utils.ts`
- **Reason**: Validation logic belongs to application layer
- **Used by**: Application layer (use cases)
- **Dependencies**: Effect-TS

## Recommended Folder Structure

```
src/
├── infrastructure/
│   └── services/
│       ├── logger.service.ts        (from utils/logger.ts)
│       ├── jwt.service.ts           (from utils/jwt.ts)
│       ├── file.service.ts          (from utils/file.utils.ts)
│       └── token.service.ts         (from utils/token.ts)
├── application/
│   └── utils/
│       └── validation.utils.ts      (from utils/validation.utils.ts)
├── utils/                           (or src/shared/)
│   ├── result.ts                    (keep or move to shared/types/)
│   └── safe-parse.ts                (keep or move to shared/utils/)
└── shared/                          (optional - if you want dedicated shared folder)
    ├── types/
    │   └── result.ts
    └── utils/
        └── safe-parse.ts
```

## Migration Steps

1. **Create infrastructure services folder**:
   ```bash
   mkdir -p src/infrastructure/services
   ```

2. **Move infrastructure services**:
   - `utils/logger.ts` → `infrastructure/services/logger.service.ts`
   - `utils/jwt.ts` → `infrastructure/services/jwt.service.ts`
   - `utils/file.utils.ts` → `infrastructure/services/file.service.ts`
   - `utils/token.ts` → `infrastructure/services/token.service.ts`

3. **Move application utilities**:
   - `utils/validation.utils.ts` → `application/utils/validation.utils.ts`

4. **Update all imports** (use find/replace):
   - `../../utils/logger` → `../../infrastructure/services/logger.service`
   - `../../utils/jwt` → `../../infrastructure/services/jwt.service`
   - `../../utils/file.utils` → `../../infrastructure/services/file.service`
   - `../../utils/token` → `../../infrastructure/services/token.service`
   - `../../utils/validation.utils` → `../utils/validation.utils`

5. **Create index files for easy imports**:
   - `src/infrastructure/services/index.ts`
   - `src/application/utils/index.ts`

## Alternative: Effect Services Pattern

If you want to follow the existing `src/effect/services/` pattern:

- Move `logger.ts` and `jwt.ts` to `src/effect/services/` instead
- This makes sense if they're used as Effect services with dependency injection

**Decision**: Choose based on whether these services need Effect's dependency injection or are simple utilities.

## Summary

| File | Current | Recommended | Reason |
|------|---------|-------------|--------|
| `logger.ts` | `utils/` | `infrastructure/services/` | Infrastructure/observability |
| `jwt.ts` | `utils/` | `infrastructure/services/` | Infrastructure/security |
| `file.utils.ts` | `utils/` | `infrastructure/services/` | Infrastructure/file operations |
| `token.ts` | `utils/` | `infrastructure/services/` | Infrastructure/security |
| `validation.utils.ts` | `utils/` | `application/utils/` | Application logic |
| `result.ts` | `utils/` | `utils/` or `shared/types/` | Shared utility |
| `safe-parse.ts` | `utils/` | `utils/` or `shared/utils/` | Shared utility |
