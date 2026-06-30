import { pgTable, pgEnum, uuid, text, boolean, integer, timestamp } from 'drizzle-orm/pg-core';

export const accountStatusEnum = pgEnum('account_status', [
  'waitlisted',
  'active',
  'suspended',
]);

export const users = pgTable('users', {
  id:             uuid('id').primaryKey().defaultRandom(),
  authId:         uuid('auth_id').unique().notNull(),
  username:       text('username').unique().notNull(),
  displayName:    text('display_name').notNull(),
  bio:            text('bio'),
  avatarUrl:      text('avatar_url'),
  coverUrl:       text('cover_url'),
  websiteUrl:     text('website_url'),
  location:       text('location'),
  isVerified:     boolean('is_verified').notNull().default(false),
  isSuspended:    boolean('is_suspended').notNull().default(false),
  accountStatus:  accountStatusEnum('account_status').notNull().default('waitlisted'),
  followerCount:  integer('follower_count').notNull().default(0),
  followingCount: integer('following_count').notNull().default(0),
  postCount:      integer('post_count').notNull().default(0),
  createdAt:      timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:      timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt:      timestamp('deleted_at', { withTimezone: true }),
});

export const userProfiles = pgTable('user_profiles', {
  id:          uuid('id').primaryKey().defaultRandom(),
  userId:      uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  displayName: text('display_name').notNull(),
  bio:         text('bio'),
  avatarUrl:   text('avatar_url'),
  headline:    text('headline'),
  createdAt:   timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:   timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
