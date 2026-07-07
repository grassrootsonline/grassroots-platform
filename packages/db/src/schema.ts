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
