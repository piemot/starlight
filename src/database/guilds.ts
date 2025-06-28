import { eq } from "drizzle-orm";
import { db, guilds, type ServiceState } from "./database.js";

export async function getGuild(guildId: string) {
	return db.select().from(guilds).where(eq(guilds.id, guildId)).get();
}

export async function getGuildServices(
	guildId: string,
): Promise<Map<string, ServiceState>> {
	const guildInfo = db
		.select()
		.from(guilds)
		.where(eq(guilds.id, guildId))
		.get();
	if (!guildInfo) {
		return new Map();
	}
	return new Map(Object.entries(guildInfo.services));
}

export async function updateGuildServices(
	guildId: string,
	services: Record<string, ServiceState>,
) {
	return db
		.insert(guilds)
		.values({ id: guildId, services })
		.onConflictDoUpdate({ set: { services }, target: guilds.id });
}
