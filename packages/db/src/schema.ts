import { pgTable, pgEnum, uuid, text, boolean, integer, numeric, timestamp, unique, index } from 'drizzle-orm/pg-core';

export const accountStatusEnum = pgEnum('account_status', [
  'waitlisted',
  'active',
  'suspended',
]);

export const users = pgTable('users', {
  id:             uuid('id').primaryKey().defaultRandom(),
  authId:         uuid('auth_id').unique().notNull(),
  username:       text('username').unique().notNull(),
  // Deprecated as of handoff 036 — display_name/bio/avatar_url are now read
  // from user_profiles. Kept here (a) because users.displayName is NOT NULL
  // and signupAction still writes it at account creation, and (b) dropping
  // columns is a separate, deliberate migration decision, not a side effect
  // of a read-path refactor. Do not read these three columns anywhere new.
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

export const careerInterestSignups = pgTable('career_interest_signups', {
  id:        uuid('id').primaryKey().defaultRandom(),
  email:     text('email').unique().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const jobPostingStatusEnum = pgEnum('job_posting_status', [
  'draft',
  'published',
  'closed',
]);

export const adminUsers = pgTable('admin_users', {
  id:        uuid('id').primaryKey().defaultRandom(),
  userId:    uuid('user_id').unique().notNull().references(() => users.id, { onDelete: 'cascade' }),
  grantedBy: uuid('granted_by').references(() => users.id),
  grantedAt: timestamp('granted_at', { withTimezone: true }).notNull().defaultNow(),
});

export const jobPostings = pgTable('job_postings', {
  id:             uuid('id').primaryKey().defaultRandom(),
  slug:           text('slug').unique().notNull(),
  title:          text('title').notNull(),
  department:     text('department'),
  location:       text('location'),
  employmentType: text('employment_type'),
  description:    text('description').notNull(),
  status:         jobPostingStatusEnum('status').notNull().default('draft'),
  createdBy:      uuid('created_by').notNull().references(() => users.id),
  createdAt:      timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:      timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  publishedAt:    timestamp('published_at', { withTimezone: true }),
  closedAt:       timestamp('closed_at', { withTimezone: true }),
});

export const jobApplications = pgTable('job_applications', {
  id:           uuid('id').primaryKey().defaultRandom(),
  postingId:    uuid('posting_id').notNull().references(() => jobPostings.id, { onDelete: 'cascade' }),
  name:         text('name').notNull(),
  email:        text('email').notNull(),
  portfolioUrl: text('portfolio_url'),
  note:         text('note'),
  createdAt:    timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const posts = pgTable('posts', {
  id:            uuid('id').primaryKey().defaultRandom(),
  authorId:      uuid('author_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  content:       text('content').notNull(),
  reactionCount: integer('reaction_count').notNull().default(0),
  commentCount:  integer('comment_count').notNull().default(0),
  createdAt:     timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:     timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt:     timestamp('deleted_at', { withTimezone: true }), // soft delete, same pattern as `users.deletedAt`
}, (table) => ({
  createdAtIdx: index('posts_created_at_idx').on(table.createdAt),
}));

export const postReactions = pgTable('post_reactions', {
  id:        uuid('id').primaryKey().defaultRandom(),
  postId:    uuid('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  userId:    uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  uniqReaction: unique('post_reactions_post_user_unique').on(table.postId, table.userId),
}));

export const comments = pgTable('comments', {
  id:            uuid('id').primaryKey().defaultRandom(),
  postId:        uuid('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  authorId:      uuid('author_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  content:       text('content').notNull(),
  reactionCount: integer('reaction_count').notNull().default(0),
  createdAt:     timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
// v1 is a flat reply list (matches ThreadView's rendering — no nested replies), so no parentCommentId.

export const follows = pgTable('follows', {
  id:          uuid('id').primaryKey().defaultRandom(),
  followerId:  uuid('follower_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  followingId: uuid('following_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt:   timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  uniqFollow: unique('follows_follower_following_unique').on(table.followerId, table.followingId),
  followerIdx: index('follows_follower_id_idx').on(table.followerId),
  followingIdx: index('follows_following_id_idx').on(table.followingId),
}));
// Enforce follower_id != following_id in the Server Action, not a DB CHECK constraint —
// simpler, and the only write path is the action.

export const notificationTypeEnum = pgEnum('notification_type', ['reaction', 'comment', 'follow']);

export const notifications = pgTable('notifications', {
  id:          uuid('id').primaryKey().defaultRandom(),
  recipientId: uuid('recipient_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  actorId:     uuid('actor_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type:        notificationTypeEnum('type').notNull(),
  postId:      uuid('post_id').references(() => posts.id, { onDelete: 'cascade' }), // null for 'follow'
  read:        boolean('read').notNull().default(false),
  createdAt:   timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  recipientIdx: index('notifications_recipient_id_idx').on(table.recipientId),
}));

export const boardCardTypeEnum = pgEnum('board_card_type', ['bug', 'idea', 'planning']);
export const boardCardStatusEnum = pgEnum('board_card_status', ['inbox', 'discussing', 'handoff', 'done']);

export const boardCards = pgTable('board_cards', {
  id:        uuid('id').primaryKey().defaultRandom(),
  authorId:  uuid('author_id').references(() => users.id, { onDelete: 'set null' }),
  type:      boardCardTypeEnum('type').notNull().default('idea'),
  title:     text('title').notNull(),
  body:      text('body'),
  status:    boardCardStatusEnum('status').notNull().default('inbox'),
  position:  numeric('position').notNull().default('0'), // drizzle numeric default is a string
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  statusPositionIdx: index('idx_board_cards_status_position').on(table.status, table.position),
  authorIdx:         index('idx_board_cards_author_id').on(table.authorId),
}));
