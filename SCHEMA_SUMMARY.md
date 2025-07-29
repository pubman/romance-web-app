# Database Schema Summary

## Overview

This document provides a comprehensive summary of the Supabase database schema for the Romance Story Generation App. The database is designed to support user authentication, subscription management, story generation, and reading progress tracking.

## Database Architecture

The schema consists of **5 main tables** with a user-centric design, where all data is tied to authenticated users through the `auth.users` table. The architecture supports:

- **User Management**: Profiles, preferences, and credit tracking
- **Subscription System**: Stripe-integrated billing with free, pro, and enterprise tiers
- **Story Generation**: AI-powered story creation with progress tracking
- **Reading Experience**: Detailed reading progress and behavior tracking
- **Content Management**: Public/private story sharing system

---

## Tables Overview

### 1. **PURCHASES**

_One-off payment tracking_

| Column                     | Type        | Description                                      |
| -------------------------- | ----------- | ------------------------------------------------ |
| `id`                       | UUID        | Primary key (auto-generated)                     |
| `user_id`                  | UUID        | Foreign key to `auth.users(id)` (CASCADE DELETE) |
| `stripe_payment_intent_id` | TEXT        | Unique Stripe payment intent ID                  |
| `price_id`                 | TEXT        | Stripe price ID                                  |
| `product_name`             | TEXT        | Name of purchased product                        |
| `amount`                   | INTEGER     | Amount in cents                                  |
| `currency`                 | TEXT        | Currency code (default: 'usd')                   |
| `status`                   | TEXT        | Payment status (default: 'completed')            |
| `created_at`               | TIMESTAMPTZ | Auto-generated timestamp                         |
| `updated_at`               | TIMESTAMPTZ | Auto-updated via trigger                         |

**Constraints:**

- `UNIQUE(stripe_payment_intent_id)` - Prevents duplicate payments
- `FOREIGN KEY(user_id)` references `auth.users(id)` ON DELETE CASCADE

**Indexes:**

- `idx_purchases_user_id` - Fast user lookup
- `idx_purchases_stripe_payment_intent_id` - Stripe integration
- `idx_purchases_created_at` - Time-based queries

---

### 2. **SUBSCRIPTIONS**

_User subscription management_

| Column                   | Type        | Description                                      |
| ------------------------ | ----------- | ------------------------------------------------ |
| `id`                     | UUID        | Primary key (auto-generated)                     |
| `user_id`                | UUID        | Foreign key to `auth.users(id)` (CASCADE DELETE) |
| `plan_name`              | TEXT        | Plan type: 'free', 'pro', 'enterprise'           |
| `stripe_customer_id`     | TEXT        | Stripe customer ID                               |
| `stripe_subscription_id` | TEXT        | Unique Stripe subscription ID                    |
| `status`                 | TEXT        | Subscription status (validated)                  |
| `billing_cycle`          | TEXT        | 'monthly', 'yearly', or null for free            |
| `current_period_start`   | TIMESTAMPTZ | Current billing period start                     |
| `current_period_end`     | TIMESTAMPTZ | Current billing period end                       |
| `trial_start`            | TIMESTAMPTZ | Trial period start                               |
| `trial_end`              | TIMESTAMPTZ | Trial period end                                 |
| `canceled_at`            | TIMESTAMPTZ | Cancellation timestamp                           |
| `ended_at`               | TIMESTAMPTZ | Subscription end timestamp                       |
| `created_at`             | TIMESTAMPTZ | Creation timestamp                               |
| `updated_at`             | TIMESTAMPTZ | Auto-updated via trigger                         |

**Constraints:**

- `UNIQUE(user_id)` - One subscription per user
- `UNIQUE(stripe_subscription_id)` - Prevents duplicates
- `CHECK(status IN (...))` - Valid status values only

**Indexes:**

- `idx_subscriptions_user_id` - User lookup
- `idx_subscriptions_stripe_customer_id` - Stripe integration
- `idx_subscriptions_status` - Status filtering
- `idx_subscriptions_user_id_status` - Composite queries

---

### 3. **PROFILES**

_User profile and preferences_

| Column                   | Type        | Description                                      |
| ------------------------ | ----------- | ------------------------------------------------ |
| `id`                     | UUID        | Primary key (auto-generated)                     |
| `user_id`                | UUID        | Foreign key to `auth.users(id)` (CASCADE DELETE) |
| `display_name`           | TEXT        | User's display name                              |
| `birthday`               | DATE        | User's birthday                                  |
| `avatar_url`             | TEXT        | Profile avatar URL                               |
| `favorite_genres`        | JSONB       | Array of favorite genres                         |
| `favorite_tropes`        | JSONB       | Array of favorite tropes                         |
| `favorite_settings`      | JSONB       | Array of favorite settings                       |
| `spice_level`            | INTEGER     | Content spice level (1-5, default: 3)            |
| `is_public_profile`      | BOOLEAN     | Profile visibility (default: true)               |
| `is_share_stories`       | BOOLEAN     | Story sharing preference (default: true)         |
| `is_email_notifications` | BOOLEAN     | Email notifications (default: false)             |
| `credits_remaining`      | INTEGER     | Remaining story credits (default: 3)             |
| `credits_used`           | INTEGER     | Total credits used (default: 0)                  |
| `has_used_free_trial`    | BOOLEAN     | Free trial flag (default: false)                 |
| `last_credit_reset`      | TIMESTAMPTZ | Last credit reset date                           |
| `created_at`             | TIMESTAMPTZ | Creation timestamp                               |
| `updated_at`             | TIMESTAMPTZ | Auto-updated via trigger                         |

**Constraints:**

- `UNIQUE(user_id)` - One profile per user
- `CHECK(spice_level BETWEEN 1 AND 5)` - Valid spice levels
- `CHECK(length(display_name) >= 2)` - Minimum name length
- `CHECK(credits_remaining >= 0)` - Non-negative credits
- `CHECK(credits_used >= 0)` - Non-negative usage

**Indexes:**

- `idx_profiles_user_id` - User lookup
- `idx_profiles_display_name` - Name searches

---

### 4. **STORIES**

_Story metadata and generation tracking_

| Column                | Type        | Description                                      |
| --------------------- | ----------- | ------------------------------------------------ |
| `id`                  | UUID        | Primary key (auto-generated)                     |
| `user_id`             | UUID        | Foreign key to `auth.users(id)` (CASCADE DELETE) |
| `title`               | TEXT        | Story title                                      |
| `description`         | TEXT        | Story description                                |
| `cover_image_url`     | TEXT        | Cover image URL                                  |
| `status`              | TEXT        | 'draft', 'generating', 'completed', 'failed'     |
| `is_public`           | BOOLEAN     | Public visibility (default: false)               |
| `content_url`         | TEXT        | URL/path to stored story content                 |
| `word_count`          | INTEGER     | Story word count (default: 0)                    |
| `chapter_count`       | INTEGER     | Number of chapters (default: 0)                  |
| `wizard_data`         | JSONB       | Complete wizard form data                        |
| `story_preferences`   | JSONB       | Genre, spice level, etc.                         |
| `generation_job_id`   | TEXT        | AI generation job tracking                       |
| `generation_progress` | INTEGER     | Progress percentage (0-100)                      |
| `draft_progress`      | TEXT        | Draft notes                                      |
| `created_at`          | TIMESTAMPTZ | Creation timestamp                               |
| `updated_at`          | TIMESTAMPTZ | Auto-updated via trigger                         |

**Constraints:**

- `CHECK(status IN ('draft', 'generating', 'completed', 'failed'))` - Valid statuses
- `CHECK(word_count >= 0)` - Non-negative word count
- `CHECK(chapter_count >= 0)` - Non-negative chapter count
- `CHECK(generation_progress >= 0 AND generation_progress <= 100)` - Valid progress

**Indexes:**

- `idx_stories_user_id` - User lookup
- `idx_stories_status` - Status filtering
- `idx_stories_user_id_status` - Composite queries
- `idx_stories_is_public` - Public story queries

---

### 5. **READING_PROGRESS**

_User reading progress tracking_

| Column                 | Type        | Description                                      |
| ---------------------- | ----------- | ------------------------------------------------ |
| `user_id`              | UUID        | Foreign key to `auth.users(id)` (CASCADE DELETE) |
| `story_id`             | UUID        | Foreign key to `stories(id)` (CASCADE DELETE)    |
| `percentage_complete`  | INTEGER     | Completion percentage (0-100)                    |
| `current_chapter`      | INTEGER     | Current chapter number (default: 1)              |
| `current_position`     | INTEGER     | Position within chapter (default: 0)             |
| `last_read_at`         | TIMESTAMPTZ | Last reading timestamp                           |
| `reading_time_minutes` | INTEGER     | Total reading time (default: 0)                  |
| `created_at`           | TIMESTAMPTZ | Creation timestamp                               |
| `updated_at`           | TIMESTAMPTZ | Auto-updated via trigger                         |

**Constraints:**

- `PRIMARY KEY(user_id, story_id)` - Composite primary key
- `CHECK(percentage_complete >= 0 AND percentage_complete <= 100)` - Valid percentage
- `CHECK(current_chapter >= 1)` - Valid chapter number
- `CHECK(current_position >= 0)` - Non-negative position
- `CHECK(reading_time_minutes >= 0)` - Non-negative time

**Indexes:**

- `idx_reading_progress_user_id` - User lookup
- `idx_reading_progress_story_id` - Story lookup
- `idx_reading_progress_last_read_at` - Recent activity queries

---

## Database Functions

### Helper Functions

1. **`get_user_subscription(user_id UUID)`** → `subscriptions`

   - Returns complete subscription record for user
   - Used for plan validation and billing queries

2. **`user_has_plan(user_id UUID, plan_name TEXT)`** → `BOOLEAN`

   - Checks if user has access to specific plan
   - Supports plan hierarchy (enterprise > pro > free)

3. **`get_user_profile(user_id UUID)`** → `profiles`

   - Returns complete profile information
   - Includes preferences and credit status

4. **`user_has_credits(user_id UUID, required_credits INTEGER)`** → `BOOLEAN`

   - Checks if user has sufficient credits or paid subscription
   - Handles both free credit system and unlimited paid access

5. **`consume_credits(user_id UUID, credits_to_consume INTEGER)`** → `BOOLEAN`

   - Consumes credits for free users
   - Only affects users without paid subscriptions

6. **`reset_monthly_credits()`** → `VOID`

   - Resets monthly credits for free users
   - Called by scheduled job

7. **`get_reading_progress(user_id UUID, story_id UUID)`** → `reading_progress`

   - Returns reading progress for specific user/story combination
   - Handles cases where no progress exists

8. **`update_reading_progress(...)`** → `reading_progress`
   - Updates or creates reading progress record
   - Handles upsert logic with proper conflict resolution

### Trigger Functions

1. **`update_updated_at_column()`**

   - Automatically updates `updated_at` timestamp on row modification
   - Applied to all tables with `updated_at` columns

2. **`handle_new_user()`**
   - Automatically creates profile record when user signs up
   - Triggered on `auth.users` INSERT

---

## Triggers

### Automatic Timestamp Updates

- `update_purchases_updated_at` → `purchases`
- `update_subscriptions_updated_at` → `subscriptions`
- `update_profiles_updated_at` → `profiles`
- `update_stories_updated_at` → `stories`
- `update_reading_progress_updated_at` → `reading_progress`

### User Management

- `on_auth_user_created` → `auth.users`
  - Creates profile automatically for new users

---

## Row Level Security (RLS)

### Access Patterns

#### **User-Owned Data**

- Users can view and modify their own records
- Applies to: `purchases`, `subscriptions`, `profiles`, `stories`, `reading_progress`

#### **Public Content**

- **Profiles**: Users can view profiles where `is_public_profile = true`
- **Stories**: Users can view stories where `is_public = true`

#### **Service Role**

- Full access to all tables for server-side operations
- Bypasses RLS for administrative tasks

### Security Policies

#### **PURCHASES**

- `purchases_user_policy`: Users can view their own purchases
- `purchases_service_policy`: Service role has full access

#### **SUBSCRIPTIONS**

- `subscriptions_user_policy`: Users can view their own subscriptions
- `subscriptions_service_policy`: Service role has full access

#### **PROFILES**

- `profiles_user_policy`: Users can view/update their own profiles
- `profiles_public_policy`: Users can view public profiles
- `profiles_service_policy`: Service role has full access

#### **STORIES**

- `stories_user_policy`: Users can view/update their own stories
- `stories_public_policy`: Users can view public stories
- `stories_service_policy`: Service role has full access

#### **READING_PROGRESS**

- `reading_progress_user_policy`: Users can view/update their own progress
- `reading_progress_service_policy`: Service role has full access

---

## Key Features

### 1. **Credit System**

- **Free Users**: 3 credits per month, reset automatically
- **Paid Users**: Unlimited story generations
- **Credit Tracking**: Detailed usage and remaining credit tracking

### 2. **Subscription Management**

- **Plans**: Free, Pro, Enterprise with hierarchy
- **Billing**: Monthly/yearly cycles with Stripe integration
- **Trials**: Support for trial periods with tracking

### 3. **Story Generation Workflow**

- **Wizard Data**: Complete form data stored as JSONB
- **Progress Tracking**: Real-time generation progress (0-100%)
- **Job Management**: Integration with AI generation services
- **Status Management**: Draft → Generating → Completed/Failed

### 4. **Reading Experience**

- **Progress Tracking**: Percentage, chapter, and position tracking
- **Time Tracking**: Total reading time accumulation
- **Last Read**: Timestamp for recent activity

### 5. **Content Sharing**

- **Public Stories**: Users can share stories publicly
- **Public Profiles**: Profile visibility controls
- **Privacy Controls**: Granular sharing preferences

### 6. **Data Relationships**

- **User-Centric**: All data tied to authenticated users
- **Cascade Deletes**: Clean data removal when users are deleted
- **Referential Integrity**: Strong foreign key relationships

---

## Usage Patterns

### User Registration Flow

1. User signs up → `auth.users` record created
2. Trigger automatically creates `profiles` record
3. User gets 3 free credits and default preferences

### Story Generation Flow

1. User completes story wizard → `wizard_data` stored
2. Credit check via `user_has_credits()`
3. Story record created with `status = 'generating'`
4. AI job initiated → `generation_job_id` stored
5. Progress updates → `generation_progress` updated
6. Completion → `status = 'completed'`, content stored

### Reading Flow

1. User opens story → `get_reading_progress()` called
2. Reading progress tracked → `update_reading_progress()` called
3. Time and position continuously updated

### Subscription Flow

1. User subscribes → Stripe webhook creates/updates `subscriptions`
2. Plan access checked via `user_has_plan()`
3. Credit restrictions removed for paid users

This schema provides a robust foundation for a romance story generation app with comprehensive user management, subscription handling, and content creation capabilities.
