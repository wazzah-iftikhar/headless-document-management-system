import { Layer } from "effect";
import {
  DatabaseService,
  DatabaseServiceLive,
  ConfigService,
  ConfigServiceLive,
  FileSystemService,
  FileSystemServiceLive,
} from "../services";

/**
 * Application Layer
 * Combines all service layers into a single layer
 * This is the main dependency injection container
 */
export const AppLayer = Layer.mergeAll(
  DatabaseServiceLive,
  ConfigServiceLive,
  FileSystemServiceLive
);

