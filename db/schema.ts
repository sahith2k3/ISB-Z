import { pgTable, serial, integer, timestamp, unique, varchar, text } from "drizzle-orm/pg-core";

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

// Friendship audit logs for analytics: records every add / remove action
export const friendshipAuditLogsTable = pgTable("friendship_audit_logs", {
  id: serial("id").primaryKey(),
  ownerId: integer("owner_id").notNull(),
  friendId: integer("friend_id").notNull(),
  action: varchar("action", { length: 16 }).notNull(), // 'add' | 'remove'
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type FriendshipAuditLog = typeof friendshipAuditLogsTable.$inferSelect;
export type InsertFriendshipAuditLog = typeof friendshipAuditLogsTable.$inferInsert;

// Classroom seating charts: persists user uploaded or scanned seating arrangements
export const seatingChartsTable = pgTable(
  "seating_charts",
  {
    id: serial("id").primaryKey(),
    courseCode: varchar("course_code", { length: 32 }).notNull(),
    section: varchar("section", { length: 16 }).notNull(),
    campus: varchar("campus", { length: 16 }).notNull(),
    imageUrl: text("image_url").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [unique().on(table.courseCode, table.section)],
);

export type SeatingChart = typeof seatingChartsTable.$inferSelect;
export type InsertSeatingChart = typeof seatingChartsTable.$inferInsert;

