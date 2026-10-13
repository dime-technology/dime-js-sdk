import { describe, expect, it } from 'vitest'
import {
  ApiException,
  AuthenticationException,
  ConnectionException,
  DimeException,
  IdempotencyException,
  NotFoundException,
  PermissionDeniedException,
  RateLimitException,
  ServerException,
  ValidationException,
} from '../../src/exceptions/index.js'
import { fakeClient } from '../helpers.js'

describe('Error handling', () => {
  it('throws ValidationException for 422 with errors map', async () => {
    const { client } = fakeClient([
      {
        status: 422,
        body: { errors: { 'data.amount': ['The amount field is required.'] } },
      },
    ])

    await expect(client.transactions.chargeCard('000010', {})).rejects.toSatisfy(
      (e) =>
        e instanceof ValidationException &&
        e.statusCode === 422 &&
        e.errors['data.amount']?.[0] === 'The amount field is required.' &&
        e.firstError() === 'The amount field is required.',
    )
  })

  it('throws ValidationException for 400 with message-map style', async () => {
    const { client } = fakeClient([
      { status: 400, body: { message: { field: ['Invalid value'] } } },
    ])

    await expect(client.addresses.create('s', 'u', {})).rejects.toBeInstanceOf(ValidationException)
  })

  it('throws AuthenticationException for 401', async () => {
    const { client } = fakeClient([{ status: 401, body: { message: 'Unauthenticated.' } }])

    await expect(client.transactions.list('000010')).rejects.toBeInstanceOf(AuthenticationException)
  })

  it('throws PermissionDeniedException for 403', async () => {
    const { client } = fakeClient([{ status: 403, body: { data: { message: 'Not authorized.' } } }])

    await expect(client.transactions.list('000010')).rejects.toBeInstanceOf(
      PermissionDeniedException,
    )
  })

  it('throws NotFoundException for 404', async () => {
    const { client } = fakeClient([{ status: 404, body: { data: { message: 'Not found.' } } }])

    await expect(client.merchants.show('bad-sid')).rejects.toBeInstanceOf(NotFoundException)
  })

  it('throws RateLimitException with retryAfter for 429', async () => {
    const { client } = fakeClient([
      // exhaust retries
      { status: 429, body: { message: 'Too many requests.' }, headers: { 'Retry-After': '30' } },
      { status: 429, body: { message: 'Too many requests.' }, headers: { 'Retry-After': '30' } },
      { status: 429, body: { message: 'Too many requests.' }, headers: { 'Retry-After': '30' } },
    ])

    await expect(client.transactions.list('000010')).rejects.toSatisfy(
      (e) => e instanceof RateLimitException && e.getRetryAfter() === 30,
    )
  })

  it('throws ServerException for 500', async () => {
    const { client } = fakeClient([
      { status: 500, body: { message: 'Internal server error' } },
      { status: 500, body: { message: 'Internal server error' } },
      { status: 500, body: { message: 'Internal server error' } },
    ])

    await expect(client.transactions.list('000010')).rejects.toBeInstanceOf(ServerException)
  })

  it('throws ApiException for other non-2xx', async () => {
    const { client } = fakeClient([{ status: 409, body: { message: 'Conflict' } }])

    await expect(client.transactions.list('000010')).rejects.toBeInstanceOf(ApiException)
  })

  it('throws IdempotencyException for 422 when the key was used for a different request', async () => {
    const message =
      'This Idempotency-Key was already used for a different request. Use a new key for each new request.'
    const { client } = fakeClient([{ status: 422, body: { data: { message } } }])

    await expect(
      client.transactions.chargeCard('000010', { amount: '10.00', token: 't' }),
    ).rejects.toSatisfy(
      (e) =>
        e instanceof IdempotencyException &&
        e instanceof ApiException &&
        e.statusCode === 422 &&
        e.message === message,
    )
  })

  it('throws IdempotencyException for 409 while the key is still in progress', async () => {
    const message =
      'A request with this Idempotency-Key is still in progress, or did not finish. Try again shortly; if this persists, check the transaction list before retrying with a new key.'
    const { client } = fakeClient([{ status: 409, body: { data: { message } } }])

    await expect(
      client.transactions.refund('000010', { amount: '5.00', transaction_info_id: 1 }),
    ).rejects.toSatisfy(
      (e) => e instanceof IdempotencyException && e.statusCode === 409 && e.message === message,
    )
  })

  it('keeps a duplicate-merchant 409 an ApiException', async () => {
    const { client } = fakeClient([
      {
        status: 409,
        body: {
          data: {
            message: 'You already have one or more merchants that look like this one.',
            possible_duplicates: [{ sid: '00031', name: 'Abundance Ministries' }],
          },
        },
      },
    ])

    await expect(client.merchants.create({ name: 'Abundance Ministries' })).rejects.toSatisfy(
      (e) => e instanceof ApiException && !(e instanceof IdempotencyException),
    )
  })

  it('keeps a held-funds key conflict an ApiException', async () => {
    const { client } = fakeClient([
      {
        status: 409,
        body: {
          data: {
            message:
              'This idempotency key was already used for a release of $1,500.00. Use a new key for a different amount.',
          },
        },
      },
    ])

    await expect(client.funds.release('000010', 'payout-1', { amount: '20.00' })).rejects.toSatisfy(
      (e) => e instanceof ApiException && !(e instanceof IdempotencyException),
    )
  })

  it('keeps a malformed Idempotency-Key header a ValidationException', async () => {
    const { client } = fakeClient([
      {
        status: 400,
        body: {
          errors: {
            'Idempotency-Key': [
              'The Idempotency-Key header must be 1 to 255 printable characters.',
            ],
          },
        },
      },
    ])

    await expect(
      client.transactions.chargeCard('000010', { amount: '10.00' }, { idempotencyKey: '' }),
    ).rejects.toBeInstanceOf(ValidationException)
  })

  it('all exceptions are instanceof DimeException', async () => {
    const cases: Array<{ status: number; body: unknown }> = [
      { status: 401, body: {} },
      { status: 403, body: {} },
      { status: 404, body: {} },
    ]

    for (const c of cases) {
      const { client } = fakeClient([c])
      await expect(client.transactions.list('000010')).rejects.toBeInstanceOf(DimeException)
    }
  })

  it('throws ConnectionException when fetch rejects', async () => {
    const networkError = new TypeError('Failed to fetch')
    const client = await import('../../src/client.js').then(
      ({ Client }) =>
        new Client({
          token: 'test-token',
          fetch: () => Promise.reject(networkError),
          sleep: () => Promise.resolve(),
          maxRetries: 0,
        } as unknown as import('../../src/config.js').Config),
    )

    await expect(client.transactions.list('000010')).rejects.toBeInstanceOf(ConnectionException)
  })
})
