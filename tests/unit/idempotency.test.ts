import { afterEach, describe, expect, it, vi } from 'vitest'
import { Client } from '../../src/client.js'
import { Config } from '../../src/config.js'
import { newIdempotencyKey } from '../../src/support/idempotency-key.js'
import { fakeClient, sentHeaders, txnResponse } from '../helpers.js'

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

const messageResponse = { status: 200, body: { data: { message: 'OK' } } }

const keyedCalls: Array<{
  name: string
  response: { status: number; body: unknown }
  call: (client: Client, key?: string) => Promise<unknown>
}> = [
  {
    name: 'chargeCard',
    response: txnResponse(),
    call: (c, key) =>
      c.transactions.chargeCard('000010', { amount: '10.00', token: 't' }, { idempotencyKey: key }),
  },
  {
    name: 'chargeCardToken',
    response: txnResponse(),
    call: (c, key) =>
      c.transactions.chargeCardToken(
        '000010',
        { amount: '10.00', token: 't' },
        { idempotencyKey: key },
      ),
  },
  {
    name: 'chargeAch',
    response: txnResponse({ transaction_type: 'ACH' }),
    call: (c, key) =>
      c.transactions.chargeAch('000010', { amount: '10.00' }, { idempotencyKey: key }),
  },
  {
    name: 'authorize',
    response: txnResponse({ pending: true }),
    call: (c, key) =>
      c.transactions.authorize('000010', { amount: '10.00', token: 't' }, { idempotencyKey: key }),
  },
  {
    name: 'capture',
    response: messageResponse,
    call: (c, key) =>
      c.transactions.capture('000010', '1234567890', undefined, { idempotencyKey: key }),
  },
  {
    name: 'refund',
    response: messageResponse,
    call: (c, key) =>
      c.transactions.refund(
        '000010',
        { amount: '5.00', transaction_info_id: 1 },
        { idempotencyKey: key },
      ),
  },
  {
    name: 'void',
    response: messageResponse,
    call: (c, key) => c.transactions.void('000010', 'CC', 123456, { idempotencyKey: key }),
  },
]

describe('Idempotency-Key', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it.each(keyedCalls)(
    '$name sends a generated key when none is given',
    async ({ response, call }) => {
      const { client, calls } = fakeClient([response])

      await call(client)

      expect(sentHeaders(calls)['Idempotency-Key']).toMatch(UUID_V4)
    },
  )

  it.each(keyedCalls)('$name sends a caller-supplied key verbatim', async ({ response, call }) => {
    const { client, calls } = fakeClient([response])

    await call(client, 'order-1042-attempt')

    expect(sentHeaders(calls)['Idempotency-Key']).toBe('order-1042-attempt')
  })

  it('works without the options argument, as before', async () => {
    const { client, calls } = fakeClient([txnResponse(), messageResponse])

    await client.transactions.chargeCard('000010', { amount: '10.00', token: 't' })
    await client.transactions.void('000010', 'CC', 123456)

    expect(sentHeaders(calls, 0)['Idempotency-Key']).toMatch(UUID_V4)
    expect(sentHeaders(calls, 1)['Idempotency-Key']).toMatch(UUID_V4)
  })

  it('generates a different key for each call', async () => {
    const { client, calls } = fakeClient([txnResponse(), txnResponse()])

    await client.transactions.chargeCard('000010', { amount: '10.00', token: 't' })
    await client.transactions.chargeCard('000010', { amount: '10.00', token: 't' })

    expect(sentHeaders(calls, 0)['Idempotency-Key']).not.toBe(
      sentHeaders(calls, 1)['Idempotency-Key'],
    )
  })

  it('resends the same generated key on every retry of a 5xx', async () => {
    const { client, calls } = fakeClient([
      { status: 502, body: { message: 'Bad gateway' } },
      { status: 503, body: { message: 'Unavailable' } },
      txnResponse(),
    ])

    await client.transactions.chargeCard('000010', { amount: '10.00', token: 't' })

    expect(calls).toHaveLength(3)
    const key = sentHeaders(calls, 0)['Idempotency-Key']
    expect(key).toMatch(UUID_V4)
    expect(sentHeaders(calls, 1)['Idempotency-Key']).toBe(key)
    expect(sentHeaders(calls, 2)['Idempotency-Key']).toBe(key)
  })

  it('resends the same key on every retry of a timeout', async () => {
    const sent: string[] = []
    let attempt = 0
    const fetch = async (_input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      sent.push((init?.headers as Record<string, string>)['Idempotency-Key'] ?? '')
      if (attempt++ < 2) {
        const timeout = new Error('This operation was aborted')
        timeout.name = 'AbortError'
        throw timeout
      }
      return new Response(JSON.stringify({ data: { message: 'Refunded' } }), { status: 200 })
    }
    const client = new Client(
      new Config({
        token: 'test-token',
        fetch: fetch as typeof globalThis.fetch,
        sleep: () => Promise.resolve(),
      }),
    )

    await client.transactions.refund('000010', { amount: '5.00', transaction_info_id: 1 })

    expect(sent).toHaveLength(3)
    expect(sent[0]).toMatch(UUID_V4)
    expect(new Set(sent).size).toBe(1)
  })

  it('resends a caller-supplied key on every retry', async () => {
    const { client, calls } = fakeClient([
      { status: 500, body: { message: 'Server error' } },
      messageResponse,
    ])

    await client.transactions.capture('000010', '1234567890', '50.00', {
      idempotencyKey: 'capture-1234567890',
    })

    expect(sentHeaders(calls, 0)['Idempotency-Key']).toBe('capture-1234567890')
    expect(sentHeaders(calls, 1)['Idempotency-Key']).toBe('capture-1234567890')
  })

  it('is not sent on calls outside the seven transaction writes', async () => {
    const { client, calls } = fakeClient([
      { status: 200, body: { data: { token: 'tok_new' } } },
      txnResponse(),
      { status: 200, body: { data: [], meta: {} } },
      { status: 200, body: { data: { uuid: 'c-1' } } },
      { status: 200, body: { data: { sid: '000011' } } },
    ])

    await client.transactions.tokenizeCard('000010', { card_number: '4111111111111111' })
    await client.transactions.show('000010', { transaction_info_id: 99 })
    await client.transactions.list('000010')
    await client.customers.create('000010', { first_name: 'Jane' })
    await client.merchants.create({ name: 'Acme' })

    for (let i = 0; i < calls.length; i++) {
      expect(sentHeaders(calls, i)).not.toHaveProperty('Idempotency-Key')
    }
  })
})

describe('newIdempotencyKey', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('uses crypto.randomUUID when it is available', () => {
    expect(newIdempotencyKey()).toMatch(UUID_V4)
  })

  it('still returns a v4 UUID without Web Crypto (Node 18)', () => {
    vi.stubGlobal('crypto', undefined)

    const keys = new Set(Array.from({ length: 50 }, () => newIdempotencyKey()))

    expect(keys.size).toBe(50)
    for (const key of keys) expect(key).toMatch(UUID_V4)
  })
})
