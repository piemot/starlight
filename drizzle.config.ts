import { defineConfig } from "drizzle-kit";

export default defineConfig({
	out: "./drizzle",
	schema: "./src/database/schema.ts",
	dialect: "sqlite",
	dbCredentials: {
		url: "app.db",
	},
});
