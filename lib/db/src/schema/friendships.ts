import { pgTable, serial, integer, timestamp, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// Friendships are one-directional: ownerId "follows" friendId (no mutual accept step).
// Both ids reference student PGIDs from the static campus roster data (not a DB table).
export const friendshipsTable = pgTable(
  "friendships",
  {
    id: serial("id").primaryKey(),
    ownerId: integer("owner_id").notNull(),
    friendId: integer("friend_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [unique().on(table.ownerId, table.friendId)],
);

export const insertFriendshipSchema = createInsertSchema(friendshipsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertFriendship = z.infer<typeof insertFriendshipSchema>;
export type Friendship = typeof friendshipsTable.$inferSelect;
