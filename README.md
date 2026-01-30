# headless-document-management-system

A headless document management system built with Bun, Elysia, and oRPC, following hexagonal architecture principles.

## Quick Start

### Install Dependencies

```bash
bun install
```

### Run the Server

```bash
bun run start
# or
bun src/index.ts
```

The server will start at `http://localhost:3000`

- **Health Check**: `GET http://localhost:3000/health`
- **oRPC Endpoint**: `POST http://localhost:3000/rpc`
- **File Upload**: `POST http://localhost:3000/documents/upload`

## Documentation

All documentation and guides are located in the [`docs/`](./docs/) folder:

- **[API Usage Guide](./docs/API_USAGE_GUIDE.md)** - Complete guide on how to use all APIs
- **[Architecture Best Practices](./docs/ARCHITECTURE_BEST_PRACTICES.md)** - Architectural guidelines
- **[Postman Testing Guide](./docs/POSTMAN_TESTING.md)** - API testing instructions

See the [docs/README.md](./docs/README.md) for a complete list of all documentation.

## Project Structure

```
src/
├── application/     # Application layer (use cases, DTOs, ports)
├── domain/          # Domain layer (entities, value objects, business logic)
├── infrastructure/  # Infrastructure layer (repositories, database)
├── presentation/    # Presentation layer (HTTP routes, oRPC procedures, controllers)
└── effect/          # Effect-TS services and layers
```

## Tech Stack

- **Runtime**: [Bun](https://bun.com) v1.3.5
- **Web Framework**: [Elysia](https://elysiajs.com)
- **RPC**: [oRPC](https://orpc.dev)
- **Database**: SQLite with Drizzle ORM
- **Architecture**: Hexagonal Architecture (Ports & Adapters)
- **Functional Programming**: Effect-TS

## License

MIT
