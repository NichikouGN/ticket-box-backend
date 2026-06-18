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

### 0.3.0 (2026-06-18)

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

### v0.2.0 (2026-06-06)

- Created concerts microservice
- Allowed user to view list of concerts, concert details, ticket info and remaining stocks (only published concerts).
- Allowed organizer to view all concerts regardless of status, create, edit, pushlish, cancel and restore a concert.
- Added optional jwt authentication for public concert route.
- Added Redis to act as a cache layer for concert service
- Changed User Service to use zod for http validation.

### v0.1.0 (2026-06-05)

- Created database schema and seed
- Created User Microservices with the following functions
  1. JWT and RBAC middleware
  2. Sign in, Sign up functionality
  3. Update user role, status for organizer
  4. View a list of active user for organizer
- Other setup
