import { eq } from "drizzle-orm";
import slugify from "slugify";
import invariant from "tiny-invariant";
import { db, tickets } from "./database.js";

export class Ticket {
	#data: typeof tickets.$inferSelect;

	id: number;
	ownerId: string;
	channelId: string;
	claimedById: string | null;
	status: "open" | "claimed" | "completed";

	constructor(data: typeof tickets.$inferSelect) {
		this.#data = data;
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
	const res: { seq: number } = db.get(
		"SELECT seq FROM SQLITE_SEQUENCE WHERE name = 'tickets'",
	);

	invariant(
		res && typeof res.seq === "number",
		"guaranteed by the sqlite sequence generation",
	);
	return res.seq;
}
