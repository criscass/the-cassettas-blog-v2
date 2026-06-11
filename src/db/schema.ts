import { boolean, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

/**
 * Schema for the tables Better Auth manages. Column names match Better Auth's
 * default Drizzle schema (camelCase, singular table names) so the built-in
 * adapter works without field mapping. Two custom `additionalFields` live on
 * `user`: `role` (admin vs. regular) and `status` (the approval gate).
 *
 * See BLOG_V2_PLAN.md §5. The `comments` table is added in Phase 3.
 */

export type UserStatus = "pending" | "approved" | "rejected";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified")
    .$defaultFn(() => false)
    .notNull(),
  image: text("image"),
  // Custom additionalFields (see src/lib/auth.ts):
  role: text("role"),
  status: text("status").$type<UserStatus>().default("pending").notNull(),
  // Anti-spam gate: email sign-ups must say how they know the admin. Nullable
  // because Google sign-ups don't go through the form.
  introduction: text("introduction"),
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => new Date())
    .notNull(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").$defaultFn(() => new Date()),
  updatedAt: timestamp("updated_at").$defaultFn(() => new Date()),
});

/**
 * Custom comments table (BLOG_V2_PLAN.md §5). One row per comment.
 * `postId` is the cleaned slug (e.g. "post-00042") and `language` ("it"/"en")
 * together scope a comment to a single rendered post. No `status` column —
 * every comment from an approved user is shown immediately (the approval gate
 * lives at sign-in, not per-comment).
 */
export const comment = pgTable("comment", {
  id: uuid("id").primaryKey().defaultRandom(),
  postId: text("post_id").notNull(),
  language: text("language").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
