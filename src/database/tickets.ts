import { eq } from "drizzle-orm";
import slugify from "slugify";
import { db, tickets } from "./database.js";
import type { User } from "discord.js";

export class Ticket {
	id: number;
	ownerId: string;
	channelId: string;
	claimedById: string | null;
	status: "open" | "claimed" | "completed";

	constructor(data: typeof tickets.$inferSelect) {
		this.id = data.id;
		this.ownerId = data.ownerId;
		this.channelId = data.channelId;
		this.claimedById = data.claimedById;
		this.status = data.status;
	}

	getName(username: string): string {
		// @ts-ignore issue with `slugify` typings
		const name = slugify(username.slice(0, 20));

		switch (this.status) {
			case "open":
				return `🔴┃${name}-${this.id}`;
			case "claimed":
				return `🟡┃${name}-${this.id}`;
			case "completed":
				return `🟢┃${name}-${this.id}`;
		}
	}

	async setStatus(status: "open" | "claimed" | "completed") {
		await db.update(tickets).set({ status });
		this.status = status;
	}

	async claimBy(claimer: User | string) {
		const claimedById = typeof claimer === "string" ? claimer : claimer.id;

		await db.update(tickets).set({ claimedById, status: "claimed" });
		this.claimedById = claimedById;
		this.status = "claimed";
	}
}

export async function getUserTickets(userId: string): Promise<Ticket[]> {
	const entries = await db
		.select()
		.from(tickets)
		.where(eq(tickets.ownerId, userId));
	return entries.map((e) => new Ticket(e));
}

export async function getTicketByChannel(
	channelId: string,
): Promise<Ticket | null> {
	const entry = db
		.select()
		.from(tickets)
		.where(eq(tickets.channelId, channelId))
		.get();
	if (!entry) return null;
	return new Ticket(entry);
}

export async function deleteTicketChannel(channelId: string) {
	return db.delete(tickets).where(eq(tickets.channelId, channelId));
}

export async function createTicket(channelId: string, ownerId: string) {
	return db.insert(tickets).values({ channelId, ownerId });
}

export async function getNextTicketIndex() {
	const res: { seq: number } | undefined = db.get(
		"SELECT seq FROM SQLITE_SEQUENCE WHERE name = 'tickets'",
	);

	return res?.seq ?? 1;
}
