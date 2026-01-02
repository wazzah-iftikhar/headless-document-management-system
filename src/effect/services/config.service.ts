import { Context, Layer } from "effect";

/**
 * Application Configuration Interface
 */
export interface AppConfig {
  port: number | string;
  jwtSecret: string;
  uploadPath: string;
  maxFileSize: number;
  downloadLinkExpiryMinutes: number;
}

/**
 * Config Service Tag
 * Represents the configuration dependency in Effect Context
 */
export class ConfigService extends Context.Tag("ConfigService")<
  ConfigService,
  AppConfig
>() {}

/**
 * Config Service Implementation
 * Provides application configuration from environment variables
 */
export const ConfigServiceLive = Layer.succeed(
  ConfigService,
  {
    port: process.env.PORT || 3000,
    jwtSecret: process.env.JWT_SECRET || "your-secret-key-change-in-production",
    uploadPath: process.env.UPLOAD_PATH || "./uploads",
    maxFileSize: 10 * 1024 * 1024, // 10MB
    downloadLinkExpiryMinutes: parseInt(
      process.env.DOWNLOAD_LINK_EXPIRY_MINUTES || "15"
    ),
  }
);

