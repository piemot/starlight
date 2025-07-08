import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";

export type ServiceState = "open" | "limited" | "closed";
export type ServicesEntry = { [name: string]: ServiceState };

export const guilds = sqliteTable("guilds", {
	id: text({ length: 20 }).primaryKey().notNull(),
	services: text({ mode: "json" }).$type<ServicesEntry>().notNull().default({}),
});

export const tickets = sqliteTable("tickets", {
	id: int().primaryKey({ autoIncrement: true }).notNull(),
	ownerId: text("owner_id", { length: 20 }).notNull(),
	channelId: text("channel_id", { length: 20 }).unique().notNull(),
	claimedById: text("claimed_by_id", { length: 20 }),
	status: text("status", { enum: ["open", "claimed", "completed"] })
		.notNull()
		.default("open"),
});
