import { desc, eq } from "drizzle-orm";
import { db, tickets } from "./database.js";

export async function getUserTickets(userId: string) {
	return db.select().from(tickets).where(eq(tickets.ownerId, userId));
}
export async function getTicketByChannel(channelId: string) {
	return db
		.select()
		.from(tickets)
		.where(eq(tickets.channelId, channelId))
		.get();
}

export async function deleteTicketChannel(channelId: string) {
	return db.delete(tickets).where(eq(tickets.channelId, channelId));
}

export async function createTicket(channelId: string, ownerId: string) {
	return db.insert(tickets).values({ channelId, ownerId });
}

export async function getTicketIndex() {
	const res = db
		.select({ id: tickets.id })
		.from(tickets)
		.orderBy(desc(tickets.id))
		.limit(1)
		.get();
	const id = res?.id ?? 0;
	return id + 1;
}
