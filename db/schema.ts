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

// Profile views tracking: logs how many times a viewer views a student's profile
export const profileViewsTable = pgTable(
  "profile_views",
  {
    id: serial("id").primaryKey(),
    viewerId: integer("viewer_id").notNull(),
    viewedId: integer("viewed_id").notNull(),
    viewCount: integer("view_count").notNull().default(1),
    lastViewedAt: timestamp("last_viewed_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [unique().on(table.viewerId, table.viewedId)],
);

export type ProfileView = typeof profileViewsTable.$inferSelect;
export type InsertProfileView = typeof profileViewsTable.$inferInsert;
