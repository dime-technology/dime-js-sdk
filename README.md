# Dime Payments JS SDK

A typed TypeScript/JavaScript client for the [Dime Payments](https://dimepayments.com) API.
Works in Node.js 18+ and any modern browser (React, Vue, Next.js, Nuxt, etc.).

```ts
import { Client } from '@dime-technology/dime-js-sdk'

const dime = new Client('your-api-token')

const txn = await dime.transactions.chargeCard('000010', {
  amount: '49.99',
  token: 'tok_abc123',
})

console.log(txn.transactionStatus) // "Success"
```

## Requirements

- Node.js 18+ (native `fetch`) **or** any modern browser
- A Dime API token (a Laravel Sanctum personal access token). Tokens are minted inside the
  Dime application, not via this SDK, and carry abilities (e.g. `transaction:charge-card-token`,
  `customer:read`) that gate which calls succeed.

## Installation

```bash
npm install @dime-technology/dime-js-sdk
```

## Configuration

The simplest setup needs only a token:

```ts
const dime = new Client('your-api-token')
```

Point it at another environment, or use `Config` for full control:

```ts
import { Client, Config } from '@dime-technology/dime-js-sdk'

// Staging environment
const dime = new Client('your-api-token', 'https://staging.dimepayments.com')

// Full control
const dime = new Client(
  new Config({
    token: 'your-api-token',
    baseUrl: 'https://app.dimepayments.com',
    timeout: 30, // seconds
    maxRetries: 2, // retries 429 / 5xx / network errors with backoff
    retryBaseDelay: 0.5,
  }),
)
```

The SDK sends `Authorization: Bearer <token>` and JSON headers on every request. Transient
failures (HTTP 429 and 5xx, network errors) are retried with exponential backoff, honoring the
`Retry-After` header when present.

## Resources

Every resource hangs off the client as a property. The merchant `sid` is always passed
explicitly; remaining fields go in an attributes object (and lookups, where the API expects
them, in a `filters` object). All amounts are returned as strings to avoid float rounding.

| Property                 | Endpoints                                                                                                                                             |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `dime.transactions`      | chargeCard, chargeAch, tokenizeCard, authorize, capture, refund, void, show, list                                                                     |
| `dime.customers`         | list, show, create, update, delete                                                                                                                    |
| `dime.paymentMethods`    | list, show, create, update, delete                                                                                                                    |
| `dime.merchants`         | list, show, create, update, getFormLink, applicationStatus                                                                                            |
| `dime.addresses`         | list, show, create, update, delete                                                                                                                    |
| `dime.deposits`          | list, listWithTransactions, show                                                                                                                      |
| `dime.recurringPayments` | list, show, create, edit, pause, cancel, activate, delete                                                                                             |
| `dime.invoices`          | list, show, create, update, delete, send, markSent, void, duplicate, pay, getLink, addLineItem, updateLineItem, deleteLineItem, listItems, createItem |
| `dime.recurringInvoices` | list, show, create, cancel                                                                                                                            |
| `dime.chargebacks`       | list, show                                                                                                                                            |
| `dime.documents`         | upload, list                                                                                                                                          |
| `dime.funds`             | balance, transactions, release                                                                                                                        |
| `dime.subscriptionPlans` | list, show, create, edit, delete, publish, archive, unarchive, subscribe                                                                              |
| `dime.subscriptions`     | list, show, pause, resume, cancel                                                                                                                     |

### Transactions

```ts
// Charge a stored token
const txn = await dime.transactions.chargeCard('000010', {
  amount: '100.00',
  token: 'tok_abc123',
  email: 'customer@example.com',
})

// Charge raw card details (merchant must be PCI compliant)
const txn = await dime.transactions.chargeCard('000010', {
  amount: '100.00',
  cardholder_name: 'John Doe',
  card_number: '4111111111111111',
  expiration_date: '01/2027',
  cvv: '123',
  billing_address: { zip: '30009' },
})

// ACH
const txn = await dime.transactions.chargeAch('000010', {
  routing_number: '123456789',
  account_number: '9876543210',
  account_type: 'Checking',
  account_name: 'John Doe',
  amount: '75.00',
})

// Tokenize without charging
const { token } = await dime.transactions.tokenizeCard('000010', {
  cardholder_name: 'John Doe',
  card_number: '4111111111111111',
  expiration_date: '01/2027',
})

// Refund / void
await dime.transactions.refund('000010', { amount: '25.00', transaction_info_id: 123456 })
await dime.transactions.void('000010', 'CC', 123456)

// Read
const txn = await dime.transactions.show('000010', { transaction_info_id: 123456 })
```

#### Authorize and capture

`authorize()` places a hold on a card without moving money; `capture()` collects it. The returned
`transactionNumber` is your handle on the hold. An authorization is captured once — capturing less
than the full amount settles that and releases the rest — so capture the true final amount, and
capture promptly (typically within 24 hours), since the issuer releases an uncaptured hold on its
own schedule.

```ts
const auth = await dime.transactions.authorize('000010', {
  amount: '100.00',
  token: 'tok_abc123', // or raw card fields, as for chargeCard
})

await dime.transactions.capture('000010', auth.transactionNumber!) // full amount
await dime.transactions.capture('000010', auth.transactionNumber!, '80.00') // or part of it

// Release the hold instead of capturing it
await dime.transactions.void('000010', 'CC', auth.transactionNumber!)
```

### Merchant onboarding status

Follow up an application sent with `getFormLink()`. `boarded` is the ground truth for "can they
take money"; while `status` is `underwriting`, read `applicationStatus` — only `needs_documents`
asks anything of the merchant. Prefer the `application_status_changed` webhook to polling.

```ts
const onboarding = await dime.merchants.applicationStatus('000010')
onboarding.status // 'underwriting'
onboarding.applicationStatus // 'needs_documents'
onboarding.boarded // false
```

### Customers, payment methods, addresses

```ts
const customer = await dime.customers.create('000010', {
  first_name: 'Jane',
  last_name: 'Doe',
  email: 'jane@example.com',
})

const pm = await dime.paymentMethods.create('000010', {
  uuid: customer.uuid,
  type: 'cc',
  cc_name_on_card: 'Jane Doe',
  cc_number: '4111111111111111',
  cc_expiration_date: '01/2027',
  cc_brand: 'Visa',
  default: true,
})

const address = await dime.addresses.create('000010', customer.uuid!, {
  recipient: 'Jane Doe',
  line_one: '123 Main St',
  city: 'Atlanta',
  state: 'GA',
  zip: '30301',
})
```

### Recurring payments

```ts
const rp = await dime.recurringPayments.create('000010', {
  name: 'Monthly donation',
  amount: '25.00',
  start_date: '2026-07-01 00:00:00',
  recurrence_schedule: 'Monthly',
  payment_method: pm.id,
  customer_uuid: customer.uuid,
})

await dime.recurringPayments.pause('000010', rp.id!, '2026-09-01 00:00:00')
await dime.recurringPayments.activate('000010', rp.id!)
await dime.recurringPayments.cancel('000010', rp.id!)
```

### Invoices

Invoices are scoped to a merchant `sid` and built from line items that each reference a merchant
item (a fund/designation). Draft invoices can be edited; once sent they are locked. Amounts are
returned as strings.

Identify the customer with `customer_uuid` — the same uuid every other resource uses, and the only
identifier the customer endpoints return. `customer_id` is still accepted for older integrations.

```ts
// Look up (or create) the items a line can reference
const items = await dime.invoices.listItems('000010')
const item = await dime.invoices.createItem('000010', {
  name: 'Consulting',
  price: 125,
  tax_deductible: false,
})

// Create a draft invoice with one or more line items
const invoice = await dime.invoices.create('000010', {
  customer_uuid: customer.uuid,
  customer_name: 'Jane Doe',
  customer_email: 'jane@example.com',
  payment_terms: 'net_15', // due_on_receipt | net_15 | net_30 | net_60
  lines: [
    { item_id: item.id, name: 'Consulting', description: '2 hours', quantity: 2, unit_price: 125 },
  ],
})

// Tweak the draft's line items (each returns the refreshed invoice)
await dime.invoices.addLineItem('000010', invoice.id!, {
  item_id: item.id!,
  name: 'Setup',
  quantity: 1,
  unit_price: 50,
})
await dime.invoices.updateLineItem('000010', invoice.id!, invoice.items[0]!.id!, { quantity: 3 })
await dime.invoices.deleteLineItem('000010', invoice.id!, invoice.items[0]!.id!)

// Email it to the customer, or activate the pay link without emailing
await dime.invoices.send('000010', invoice.id!)
await dime.invoices.markSent('000010', invoice.id!)

// Share the public pay link
const { publicUrl } = await dime.invoices.getLink('000010', invoice.id!)

// Take a merchant-initiated (MOTO) payment against an open invoice
await dime.invoices.pay('000010', invoice.id!, {
  payment_type: 'cc', // cc | ach
  token: 'tok_abc123',
  amount: 100, // optional partial amount when the invoice allows it
})

// Duplicate, void, delete
const copy = await dime.invoices.duplicate('000010', invoice.id!)
await dime.invoices.void('000010', invoice.id!)
await dime.invoices.delete('000010', copy.id!) // drafts only

// List, optionally filtered by status
const page = await dime.invoices.list('000010', { status: 'sent' })
```

**Statuses.** `invoice.status` is one of `draft`, `sent`, `viewed`, `partially_paid`, `paid`, `void` or
`refunded`. `paid` is not always final: if the customer's bank returns an ACH payment, the invoice is
reopened (back to `partially_paid`, `viewed` or `sent`, with `amountPaid` and `balance` updated) and an
`invoice_payment_returned` webhook fires. Re-read the invoice rather than caching a `paid` status forever.

#### Making the customer cover processing fees

Set `cover_fee_required` and the customer must pay the processing fee — it is not an optional
checkbox at checkout. The fee is **not** a line item and is **not** part of `total`: the merchant is
still owed `total`, and the fee is added on top of whatever the customer pays.

Card and ACH rates differ, so the charge depends on how the customer pays. `coverFeeQuote` gives you
both, quoted against the outstanding balance:

```ts
const invoice = await dime.invoices.create('000010', {
  customer_uuid: customer.uuid,
  customer_name: 'Jane Doe',
  customer_email: 'jane@example.com',
  payment_terms: 'net_15',
  cover_fee_required: true, // omit to inherit the merchant's invoice setting
  lines: [{ item_id: 5, name: 'Consulting', quantity: 1, unit_price: 100 }],
})

invoice.total // '100.00' — what the merchant is owed
invoice.coverFeeQuote?.ccTotal // '104.32' — charged if they pay by card
invoice.coverFeeQuote?.achTotal // '101.26' — charged if they pay by bank
```

The card figure is the higher of the two and is what the invoice and its emails lead with. A partial
payment re-quotes the fee against the partial amount, so treat the quote as "settling in full today"
rather than a fixed charge. `coverFeeQuote` is `undefined` when no fee is required.

To reconcile a payment, `amount` was credited to the invoice and `coverFee` was charged on top:

```ts
const payment = invoice.payments[0]!
payment.amount // '100.00' — applied to the balance
payment.coverFee // '4.32'  — the fee the customer also paid
// The customer was charged amount + coverFee.
```

`pay()` behaves the same way: the fee for the `payment_type` you pass is added to `amount`, so the
card or bank account is debited more than the invoice is credited.

### Recurring invoices

Recurring-invoice templates generate and send invoices on a schedule. `cover_fee_required` is copied
onto every invoice a template generates.

```ts
const template = await dime.recurringInvoices.create('000010', {
  customer_uuid: customer.uuid,
  payment_terms: 'net_15',
  recurring_frequency: 'Monthly', // Weekly | Biweekly | FirstFifteenth | Monthly | Yearly
  recurring_start_date: '2026-08-01',
  recurring_end_date: '2027-08-01', // optional
  cover_fee_required: true, // optional
  lines: [{ item_id: 5, name: 'Monthly retainer', quantity: 1, unit_price: 500 }],
})

const detail = await dime.recurringInvoices.show('000010', template.id!)
detail.upcomingRunDates // ['2026-08-01', '2026-09-01', ...]

await dime.recurringInvoices.cancel('000010', template.id!)

const page = await dime.recurringInvoices.list('000010', { status: 'Active' })
```

### Chargebacks and documents

Chargebacks come from the processor's once-daily file, so they reflect the latest import rather
than live dispute activity. Pair these calls with the `chargeback_*` webhooks and use them to
reconcile. They need the `chargeback:read` ability.

```ts
const page = await dime.chargebacks.list('000010', {
  start_date: '2026-04-01 00:00:00',
  end_date: '2026-04-30 23:59:59',
  representment_status: 'New', // optional
})

const chargeback = await dime.chargebacks.show('000010', '1134722723')
chargeback.chargebackAmount // '391.48'
chargeback.representmentDate // deadline for evidence
```

`documents.upload()` sends underwriting paperwork, identity verification and chargeback evidence
— up to 10 PDF, JPG, PNG, DOC, DOCX or RTF files of 9 MB or less per call. Pass `Blob`/`File`
objects, or raw bytes with a file name. It is the one `multipart/form-data` request in the API;
the SDK builds the form for you. Files are stored independently, so check `failed` and re-send
only those.

```ts
import { readFile } from 'node:fs/promises'

const result = await dime.documents.upload(
  '000010',
  'RetrievalRequest', // Verification | FraudHolds | Underwriting | RetrievalRequest
  [{ content: await readFile('receipt.pdf'), filename: 'receipt.pdf' }],
  chargeback.transactionInfoId, // optional: attach as evidence to this chargeback
)
result.failed // [] when everything stored

const documents = await dime.documents.list('000010', { doc_type: 'RetrievalRequest' })
```

Uploading does not forward a document to the processor; our team reviews it and does that.
`sentToProcessorAt` is set once they have.

### Held funds

For merchants on a tier that holds their balance rather than sweeping it to their bank (others get
a 422). Reading needs `funds:read`; releasing needs `funds:release` and an affiliate key.

```ts
const balance = await dime.funds.balance('000010')
balance.releasable // '5172.72' — what a release is checked against

const { transactions } = await dime.funds.transactions('000010')

// Release by amount, or by transaction_info_ids (all or nothing)
const result = await dime.funds.release('000010', 'payout-2026-10-06-0001', { amount: '1500.00' })
await dime.funds.release('000010', 'payout-2026-10-06-0002', {
  transaction_info_ids: transactions.map((t) => t.transactionInfoId!),
})

result.release.status // 'released' | 'failed' | 'unknown'
```

Use a fresh idempotency key per intended release and **reuse it when retrying**: a release that
timed out may still have gone through, and the same key returns the original instead of sending the
money twice. Always check `release.status` — a declined (`failed`) release is returned, not thrown.
Requests that release nothing (an ineligible transaction, more than is releasable, a reused key, a
release already in flight) throw an `ApiException`; `getResponseBody()` carries the detail.

### Subscription plans and subscriptions

A plan is a recurring bundle of line items. It starts as a draft, is published to take
subscribers, and is archived to stop new ones. Subscribers keep the snapshot they signed up to, so
editing or archiving a plan never changes an existing subscription.

```ts
const plan = await dime.subscriptionPlans.create('000010', {
  name: 'Monthly Membership',
  recurrence_schedule: 'Monthly', // Weekly | Biweekly | FirstFifteenth | Monthly | Yearly
  allow_public: true, // optional: list it in the public catalog
  lines: [{ item_id: 96, name: 'Membership', quantity: 1, unit_price: 25 }],
})

await dime.subscriptionPlans.publish('000010', plan.id!)
plan.publicUrl // hosted subscribe page

// Charge the first payment to a saved payment method and enroll the customer
const { subscriptionId } = await dime.subscriptionPlans.subscribe(
  '000010',
  plan.id!,
  customer.uuid!,
  pm.id!,
)

// edit() replaces the plan wholesale — send every field, not just what changed
await dime.subscriptionPlans.edit('000010', plan.id!, {
  name: 'Membership',
  recurrence_schedule: 'Monthly',
  lines: [{ item_id: 96, name: 'Membership', quantity: 1, unit_price: 30 }],
})
await dime.subscriptionPlans.archive('000010', plan.id!)
await dime.subscriptionPlans.unarchive('000010', plan.id!) // back to draft
await dime.subscriptionPlans.delete('000010', plan.id!) // only with no subscribers

const plans = await dime.subscriptionPlans.list('000010', 'active') // draft | active | archived
```

```ts
const page = await dime.subscriptions.list('000010', {
  status: 'Active', // Active | Failed | Paused | Cancelled | Ended
  customer_uuid: customer.uuid, // optional
})

const subscription = await dime.subscriptions.show('000010', subscriptionId!)
subscription.nextRunDate
subscription.items // the line items snapshotted at subscribe time

await dime.subscriptions.pause('000010', subscriptionId!, '2026-12-01') // omit the date to pause indefinitely
await dime.subscriptions.resume('000010', subscriptionId!)
await dime.subscriptions.cancel('000010', subscriptionId!)
```

## Pagination

List endpoints return a `CursorPage`. Iterate one page, walk pages manually, or stream every
item across all pages with `autoPaging()`:

```ts
const page = await dime.transactions.list('000010', {
  start_date: '2026-01-01 00:00:00',
  end_date: '2026-01-31 23:59:59',
})

// First page only
for (const txn of page) {
  console.log(txn.amount)
}

// Next page
if (page.hasMore()) {
  const next = await page.next()
}

// Every transaction across every page (fetches lazily as you iterate)
for await (const txn of page.autoPaging()) {
  console.log(txn.transactionNumber)
}
```

## Error handling

Every failure throws a `DimeException` subclass. Catch the base type, or a specific one:

```ts
import {
  DimeException,
  ValidationException,
  RateLimitException,
} from '@dime-technology/dime-js-sdk'

try {
  await dime.transactions.chargeCard('000010', { amount: '0' })
} catch (e) {
  if (e instanceof ValidationException) {
    e.getErrors() // { 'data.amount': ['must be greater than 0'] }
    e.firstError()
  } else if (e instanceof RateLimitException) {
    const wait = e.getRetryAfter() ?? 1
    await new Promise((r) => setTimeout(r, wait * 1000))
  } else if (e instanceof DimeException) {
    e.getStatusCode() // HTTP status
    e.getResponseBody() // decoded API body
  }
}
```

| Exception                   | When                                           |
| --------------------------- | ---------------------------------------------- |
| `ValidationException`       | HTTP 400/422 with field errors                 |
| `AuthenticationException`   | HTTP 401 (missing/invalid token)               |
| `PermissionDeniedException` | HTTP 403 (belongs-to-company guard)            |
| `NotFoundException`         | HTTP 404                                       |
| `RateLimitException`        | HTTP 429 (carries `Retry-After`)               |
| `ServerException`           | HTTP 5xx                                       |
| `ConnectionException`       | No HTTP response (DNS, timeout, network error) |
| `ApiException`              | Any other non-2xx                              |

## Notes

- **GET parameters travel in the query string.** The Dime API reads the same `{ data, filters }`
  envelope from a JSON body or from bracketed query parameters (`data[sid]=…`). Fetch forbids a
  body on `GET`, so the SDK sends reads as query parameters; you never build either by hand.
- **No API versioning.** Endpoints live under `/api` with no version prefix.
- **Browser use:** API tokens should generally not be exposed in browser environments. This SDK
  is designed primarily for server-side use (Node.js, Next.js API routes, etc.).

## Development

```bash
npm install
npm test          # Vitest
npm run typecheck # tsc --noEmit
npm run lint      # Prettier check
npm run build     # tsup (ESM + CJS + .d.ts)
```

## License

MIT. See [LICENSE](LICENSE).
