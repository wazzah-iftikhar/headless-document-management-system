import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import * as schema from "../models";

const sqlite = new Database("database.sqlite");
export const db = drizzle(sqlite, { schema });
