/**
 * Application Ports (Outbound Ports)
 * 
 * These interfaces define what the application layer needs from the infrastructure layer.
 * In hexagonal architecture, ports are defined by the application (what it needs),
 * and adapters in the infrastructure layer implement these ports.
 * 
 * This follows the Dependency Inversion Principle:
 * - Application layer defines the interfaces (ports)
 * - Infrastructure layer implements the interfaces (adapters)
 * - Application depends on abstractions, not concretions
 */

export * from "./document.repository.port";
export * from "./user.repository.port";
export * from "./access-policy.repository.port";
export * from "./document-version.repository.port";
export * from "./download-token.repository.port";