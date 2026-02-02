/**
 * Structured Logging Service
 * 
 * Provides structured JSON logging with:
 * - Correlation ID tracking
 * - Performance metrics
 * - Context enrichment (userId, workspaceId, etc.)
 * - Log levels (info, warn, error, debug)
 * 
 * Logs are output as JSON for easy parsing by log aggregation tools.
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogContext {
  correlationId?: string;
  userId?: string;
  workspaceId?: string;
  requestId?: string;
  operation?: string;
  [key: string]: unknown;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  performance?: {
    durationMs: number;
    operation: string;
  };
}

/**
 * Logger Class
 * 
 * Provides structured logging with correlation tracking.
 * All logs are output as JSON for easy parsing.
 */
export class Logger {
  private correlationId?: string;
  private context: LogContext = {};

  /**
   * Create a new logger instance with optional correlation ID
   */
  constructor(correlationId?: string, context?: LogContext) {
    this.correlationId = correlationId;
    this.context = { ...context, correlationId };
  }

  /**
   * Set correlation ID for this logger instance
   */
  setCorrelationId(correlationId: string): void {
    this.correlationId = correlationId;
    this.context.correlationId = correlationId;
  }

  /**
   * Add context to all subsequent logs
   */
  setContext(context: Partial<LogContext>): void {
    this.context = { ...this.context, ...context };
  }

  /**
   * Get current correlation ID
   */
  getCorrelationId(): string | undefined {
    return this.correlationId;
  }

  /**
   * Log at debug level
   */
  debug(message: string, additionalContext?: LogContext): void {
    this.log("debug", message, additionalContext);
  }

  /**
   * Log at info level
   */
  info(message: string, additionalContext?: LogContext): void {
    this.log("info", message, additionalContext);
  }

  /**
   * Log at warn level
   */
  warn(message: string, additionalContext?: LogContext): void {
    this.log("warn", message, additionalContext);
  }

  /**
   * Log at error level
   */
  error(message: string, error?: Error, additionalContext?: LogContext): void {
    const errorContext: LogContext = {
      ...additionalContext,
      error: error
        ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
          }
        : undefined,
    };
    this.log("error", message, errorContext);
  }

  /**
   * Log performance metric
   */
  performance(operation: string, durationMs: number, additionalContext?: LogContext): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: "info",
      message: `Performance: ${operation}`,
      context: {
        ...this.context,
        ...additionalContext,
      },
      performance: {
        durationMs,
        operation,
      },
    };
    this.output(entry);
  }

  /**
   * Internal log method
   */
  private log(level: LogLevel, message: string, additionalContext?: LogContext): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: {
        ...this.context,
        ...additionalContext,
      },
    };
    this.output(entry);
  }

  /**
   * Output log entry (JSON format)
   */
  private output(entry: LogEntry): void {
    // In production, you might want to use a proper logging library
    // For now, output as JSON to stdout
    const output = JSON.stringify(entry);
    
    // Use appropriate console method based on level
    switch (entry.level) {
      case "error":
        console.error(output);
        break;
      case "warn":
        console.warn(output);
        break;
      case "debug":
        // Only log debug in development
        if (process.env.NODE_ENV !== "production") {
          console.debug(output);
        }
        break;
      case "info":
      default:
        console.log(output);
        break;
    }
  }

  /**
   * Create a child logger with additional context
   */
  child(additionalContext: LogContext): Logger {
    const childLogger = new Logger(this.correlationId, {
      ...this.context,
      ...additionalContext,
    });
    return childLogger;
  }
}

/**
 * Global logger instance (for use without correlation ID)
 */
export const logger = new Logger();

/**
 * Create a logger with correlation ID
 */
export function createLogger(correlationId: string, context?: LogContext): Logger {
  return new Logger(correlationId, context);
}

/**
 * Performance tracking utility
 * 
 * Usage:
 * ```ts
 * const track = startPerformanceTracking("operation-name");
 * // ... do work ...
 * track.end(logger);
 * ```
 */
export class PerformanceTracker {
  private startTime: number;
  private operation: string;

  constructor(operation: string) {
    this.operation = operation;
    this.startTime = Date.now();
  }

  /**
   * End tracking and log performance metric
   */
  end(logger: Logger, additionalContext?: LogContext): number {
    const durationMs = Date.now() - this.startTime;
    logger.performance(this.operation, durationMs, additionalContext);
    return durationMs;
  }

  /**
   * Get current duration without logging
   */
  getDuration(): number {
    return Date.now() - this.startTime;
  }
}

/**
 * Start performance tracking
 */
export function startPerformanceTracking(operation: string): PerformanceTracker {
  return new PerformanceTracker(operation);
}
