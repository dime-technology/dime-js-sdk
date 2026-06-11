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
const dime = new Client(new Config({
  token: 'your-api-token',
  baseUrl: 'https://app.dimepayments.com',
  timeout: 30,        // seconds
  maxRetries: 2,      // retries 429 / 5xx / network errors with backoff
  retryBaseDelay: 0.5,
}))
```

The SDK sends `Authorization: Bearer <token>` and JSON headers on every request. Transient
failures (HTTP 429 and 5xx, network errors) are retried with exponential backoff, honoring the
`Retry-After` header when present.

## Resources

Every resource hangs off the client as a property. The merchant `sid` is always passed
explicitly; remaining fields go in an attributes object (and lookups, where the API expects
them, in a `filters` object). All amounts are returned as strings to avoid float rounding.

| Property                     | Endpoints                                                        |
| ---------------------------- | ---------------------------------------------------------------- |
| `dime.transactions`          | chargeCard, chargeAch, tokenizeCard, refund, void, show, list    |
| `dime.customers`             | list, show, create, update, delete                               |
| `dime.paymentMethods`        | list, show, create, update, delete                               |
| `dime.merchants`             | list, show, create, update, getFormLink                          |
| `dime.addresses`             | list, show, create, update, delete                               |
| `dime.deposits`              | list, listWithTransactions, show                                 |
| `dime.recurringPayments`     | list, show, create, edit, pause, cancel, activate, delete        |

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
    e.getErrors()   // { 'data.amount': ['must be greater than 0'] }
    e.firstError()
  } else if (e instanceof RateLimitException) {
    const wait = e.getRetryAfter() ?? 1
    await new Promise(r => setTimeout(r, wait * 1000))
  } else if (e instanceof DimeException) {
    e.getStatusCode()    // HTTP status
    e.getResponseBody()  // decoded API body
  }
}
```

| Exception                    | When                                                         |
| ---------------------------- | ------------------------------------------------------------ |
| `ValidationException`        | HTTP 400/422 with field errors                               |
| `AuthenticationException`    | HTTP 401 (missing/invalid token)                             |
| `PermissionDeniedException`  | HTTP 403 (belongs-to-company guard)                          |
| `NotFoundException`          | HTTP 404                                                     |
| `RateLimitException`         | HTTP 429 (carries `Retry-After`)                             |
| `ServerException`            | HTTP 5xx                                                     |
| `ConnectionException`        | No HTTP response (DNS, timeout, network error)               |
| `ApiException`               | Any other non-2xx                                            |

## Notes

- **GET requests carry a JSON body.** The Dime API expects read parameters in the request body
  even for `GET` endpoints; the SDK handles this transparently.
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
