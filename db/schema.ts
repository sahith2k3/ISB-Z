import { pgTable, serial, integer, timestamp, unique } from "drizzle-orm/pg-core";

// Friendships are one-directional: ownerId "follows" friendId (no mutual accept step).
// Both ids reference student PGIDs from the static campus roster data.
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

export type Friendship = typeof friendshipsTable.$inferSelect;
export type InsertFriendship = typeof friendshipsTable.$inferInsert;
