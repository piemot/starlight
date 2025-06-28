import { drizzle } from "drizzle-orm/better-sqlite3";

export * from "./schema.js";

export const db = drizzle("app.db");
