# Order Request Stage

Current checkout goes straight from cart conversion to `awaiting_transfer`.
That works for the simple transfer flow, but it does not support the product
request model you described:

1. customer submits request
2. admin accepts request
3. system shows payable amount and transfer details
4. customer sends money

## Why this is not a UI-only change

The current schema and repository flow assume that:

- an order is created immediately
- payment instructions are created immediately
- inventory is reserved immediately
- customer can pay immediately

That behavior is wired through:

- `db/migrations/0006__orders_and_payments.sql`
- `src/lib/db/repositories/cart-repository.ts`
- `src/lib/db/repositories/order-inventory.ts`
- `src/lib/db/repositories/orders-repository.ts`
- `src/lib/orders/presentation.ts`

## Minimum change needed

Add a real request state before payment:

- order status: `requested`
- payment status: `pending_request` or no payment row until acceptance
- fulfillment status: `pending`

## Required flow changes

Checkout:

- create request instead of payable order
- do not reserve inventory yet
- do not create active transfer instruction yet

Admin:

- accept request
- reject request
- on accept:
  - confirm inventory
  - create payment instruction
  - move order to `awaiting_transfer`
- on reject:
  - close request cleanly with a customer-visible note

Customer:

- see `Request received`
- if accepted, see transfer details
- if rejected, see clear reason and next step

## Important constraint

If we skip the schema/state change and simply allow zero-stock checkout through,
the system would still ask the customer to pay before admin acceptance. That is
the wrong product behavior, so it was not shipped in this pass.
