# Ticket Box Backend

## 1. Introduction

## 2. Collaborators

## 3. How to setup

1. Open up the terminal and type in

```bash
git clone https://github.com/NichikouGN/happy-recipe-frontend.git
```

2. After that, run

```bash
npm install
```

3. Change the .env file to point to the backend

```js
VITE_API_URL = "http://localhost:4000"; //default
```

4. Start up the server

```bash
npm run dev
```

## 4. Version

### v0.7.0: CSV Import for VIP Guests (2026-07-05)

#### New additions

- Added a new endpoint to import VIP guests from a CSV file for a specific concert, get a list of VIP guests.
- Added a new staff route within concert service to handle check-in for VIP guests.

#### Changes

- Remove Organizer from being able to check-in in ticket service.

### v0.6.3: Explicit BullMQ Job Id changes (2026-07-04)

#### Changes

- Added job_id to outbox tables schema to store the BullMQ job ID for tracking.
- Made BullMQ uses explicit jobId to avoid duplicate jobs being created when the same event is processed multiple times (aside from concert AI Bio Generate Jobs).
- Updated relay and cron jobs to use the job_id from outbox table when adding jobs to BullMQ queues.

#### Fixes

- Changed maximum connections for supabase to prevent max pool size error.

### v0.6.2: Minor Changes & Fixes (2026-06-30)

- Set time for setTimeout in `order.controller.ts`.
- Add await before db.transaction in `handlePaymentSuccess.job.ts`.
- Change from string concat to string literal in some url.

### v0.6.1: Minor Changes & Fixes (2026-06-27)

#### Changes

- Added a missing endpoint to get confirmation for order status after purchase is completed.
- Changed stream api to /stream/payment-url and /stream/order-confirm to have better separation.
- Split ActiveSSEConnections into paymentUrlConnections and orderConfirmConnections to have better separation.

#### Fixes

- Fixed concert service not returning entries older than current date when fetching concerts.

### v0.6.0: Artist & AI Bio Generation (2026-06-25)

#### New additions

- Added an artists table to store artist information.

```sql
  CREATE TABLE artists (
      id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name                VARCHAR(255) NOT NULL,
  );
```

- Added a concerts_artist table to join concerts and artists. The artist ai_bio, verified_bio and bio_status are included.

```sql
  CREATE TABLE concerts_artist (
      concert_id          UUID NOT NULL REFERENCES concerts(id) ON DELETE CASCADE,
      artist_id           UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
      ai_bio              TEXT,
      verified_bio        TEXT,
      bio_status          VARCHAR(255) NOT NULL DEFAULT 'PENDING' CHECK (bio_status IN ('PENDING', 'AWAITING_REVIEW', 'APPROVED','REJECTED')),
      created_at          TIMESTAMPTZ DEFAULT now(),
  );
```

- Added a create artist api that accept an array of artists' name.
- Added link artist api that accept an array of artist_id to link to a concert.
- Added api to generate ai_bio, get a list of ai_bio waiting to review and approve or reject the ai_bio.
- Added concert outbox table to store and relay events related to artist bio generation.
- Added a worker and job to handle the ai_bio generation asynchronously using Gemini AI API.

#### Changes

- Concert table no longer has artist_id, instead it will be linked to artists through concerts_artist table.
- Changed existing update concert api to take into account the new concerts table changes
- Changed get notifications and get concerts to return meta including the page, limit and total items.
- Changed ensureConcertCache in Order Service to no longer return ticketTypes, instead it will set a redis key
- Changed the function that build catalogMap in Order Service to get data from redis key instead of from ensureConcertCache.
- Made the first connection to SSE on Order Service ignore when a payment does not exist yet instead of throwing an error.
- Changed some variable names to camelCase to follow the naming convention.
- Made some blocking functions use Promise.all() to execute in parallel to improve performance.
- Added Promise<> to more repository functions to make typing more explicit.

#### Fixes

- Added a missing notification proxy in api gateway.
- Fixed a bug in notification that uses the wrong varible name when generating an email.
- Fixed a bug in Ticket Service that parsed the wrong private and public ed25519 key when signing ticket.

### v0.5.0: Notification Service (2026-06-22)

- Added Notification Service to handle user notifications.
  1. Added notification worker and job to handle notification creation asynchronously.
  2. Added notification route, controller to handle fetching user notifications and marking them as read.
  3. Added SSE to handle real-time notifications to users.
  4. Added notification_reminders table to store notification reminders for upcoming concerts.

```sql
  CREATE TABLE notification_reminders (
      id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      metadata            JSONB NOT NULL,
      scheduled_at        TIMESTAMPTZ NOT NULL,
      processed_at        TIMESTAMPTZ,
      created_at          TIMESTAMPTZ DEFAULT now(),
  );
```

5. Added cron job to automatically create notification reminders for upcoming concerts.
6. Added Email Notification using Nodemailer to send email notifications to users for ticket purchase confirmation and reminders.

### v0.4.0: Ticket Service (2026-06-20)

- Added Ticket Service to handle ticket management and check-in.
  1. Added ticket worker and job to handle ticket creation asynchronously.
  2. Added check-in route, controller to handle check-in and verify ticket validity.
- Changed Ticket table to not include sha256 and aes256 columns, instead store ticket information.

  ```sql
  CREATE TABLE tickets (
      id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      concert_id          UUID NOT NULL REFERENCES concerts(id) ON DELETE CASCADE,
      order_id            UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      ticket_type_id      UUID NOT NULL REFERENCES ticket_types(id) ON DELETE CASCADE,
      status              VARCHAR(255) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('UNUSED', 'USED')),
      used_at             TIMESTAMPTZ,
      used_by_staff       UUID REFERENCES users(id) ON DELETE SET NULL,
      created_at          TIMESTAMPTZ DEFAULT now(),
  );
  ```

- Updated Order Service to emit a CREATE_TICKET event to Ticket Service upon order creation and payment success.

### v0.3.0: Order and Payment Services (2026-06-18)

- Added BullMQ to handle order processing and payment processing asynchronously.
  1. Added order and payment queue to handle order creation and payment processing.
  2. Assigned 3 attempts with exponential backoff to handle failed jobs.
- Added Transactional Outbox Pattern to handle order and payment processing reliably.
  1. Added order and payment outbox table to store events.

  ```sql
  CREATE TABLE orders_outbox (
      id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      event_type       VARCHAR(255) NOT NULL,
      payload          JSONB NOT NULL,
      status           VARCHAR(255) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED')),
      created_at       TIMESTAMPTZ DEFAULT now(),
      next_retry_at    TIMESTAMPTZ DEFAULT now()
  );
  ```

  2. Added relay job to automatically listen to outbox table and publish events to message broker.
  3. Added Cron job to automatically retry pending events in outbox table.

- Added Order Service to handle order creation, payment and order history.
  1. Added ticket stock check to ensure that the ticket is still available.
  2. Added ticket limitation check to ensure that the user has not exceeded the ticket limitation.
  3. Added worker and job to handle order creation and payment processing asynchronously.
  4. Added Redis Pub/Sub to handle communication between frontend and backend using SSE (Server-Sent Events).
- Added Payment Service to handle payment gateway integration and payment status.
  1. Added Stripe as payment gateway to handle payment processing.
  2. Added webhook to handle payment status update from Stripe.
  3. Added worker and job to handle payment status update asynchronously.
  4. Added refund route to handle late webhook from Stripe.
  5. Added Refund table to store refund information.

  ```sql
  CREATE TABLE refunds (
      id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      payment_id          UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
      payment_intent_id   VARCHAR(255) NOT NULL,
      status              VARCHAR(255) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED')),
      amount              DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
      reason              VARCHAR(255) NOT NULL DEFAULT '',
      created_at          TIMESTAMPTZ DEFAULT now(),
      updated_at          TIMESTAMPTZ DEFAULT now()
  );
  ```

### v0.2.0: Concert Service (2026-06-06)

- Created concerts microservice
- Allowed user to view list of concerts, concert details, ticket info and remaining stocks (only published concerts).
- Allowed organizer to view all concerts regardless of status, create, edit, pushlish, cancel and restore a concert.
- Added optional jwt authentication for public concert route.
- Added Redis to act as a cache layer for concert service
- Changed User Service to use zod for http validation.

### v0.1.0: Initial Release (2026-06-05)

- Created database schema and seed
- Created User Microservices with the following functions
  1. JWT and RBAC middleware
  2. Sign in, Sign up functionality
  3. Update user role, status for organizer
  4. View a list of active user for organizer
- Other setups
