import { describe, expect, it } from 'vitest'
import {
  ApiException,
  CaptureException,
  CaptureResult,
  IdempotencyException,
  MessageResult,
  ValidationException,
} from '../../src/index.js'
import { fakeClient, sentBody, sentQuery, sentUrl, txnResponse } from '../helpers.js'

describe('Transactions', () => {
  it('chargeCard sends correct envelope and maps response', async () => {
    const { client, calls } = fakeClient([txnResponse()])

    const txn = await client.transactions.chargeCard('000010', {
      amount: '100.00',
      token: 'tok_abc',
    })

    expect(sentBody(calls)).toEqual({
      data: { sid: '000010', amount: '100.00', token: 'tok_abc' },
    })
    expect(txn.transactionStatus).toBe('Success')
    expect(txn.amount).toBe('100.00')
  })

  it('chargeAch sends correct path', async () => {
    const { client, calls } = fakeClient([txnResponse({ transaction_type: 'ACH' })])

    await client.transactions.chargeAch('000010', {
      routing_number: '123456789',
      account_number: '9876543210',
      account_type: 'Checking',
      account_name: 'John Doe',
      amount: '75.00',
    })

    expect(sentUrl(calls)).toContain('transaction/charge-ach')
  })

  it('tokenizeCard returns a token string', async () => {
    const { client } = fakeClient([{ status: 200, body: { data: { token: 'tok_new' } } }])

    const result = await client.transactions.tokenizeCard('000010', {
      cardholder_name: 'Jane Doe',
      card_number: '4111111111111111',
      expiration_date: '01/2027',
    })

    expect(result.token).toBe('tok_new')
  })

  it('refund returns a MessageResult', async () => {
    const { client } = fakeClient([
      { status: 200, body: { data: { message: 'Refund successful' } } },
    ])

    const result = await client.transactions.refund('000010', {
      amount: '25.00',
      transaction_info_id: 123456,
    })

    expect(result.message).toBe('Refund successful')
  })

  it('void sends PATCH with transaction_type and transaction_id', async () => {
    const { client, calls } = fakeClient([{ status: 200, body: { data: { message: 'Voided' } } }])

    await client.transactions.void('000010', 'CC', 123456)

    expect(sentBody(calls)).toEqual({
      data: { sid: '000010', transaction_type: 'CC', transaction_id: 123456 },
    })
  })

  it('show sends GET to transaction endpoint', async () => {
    const { client, calls } = fakeClient([txnResponse()])

    await client.transactions.show('000010', { transaction_info_id: 99 })

    expect(sentUrl(calls)).toContain('/api/transaction')
    expect(sentQuery(calls)).toMatchObject({
      'data[sid]': '000010',
      'data[transaction_info_id]': '99',
    })
  })

  it('list returns a CursorPage', async () => {
    const { client } = fakeClient([
      {
        status: 200,
        body: {
          data: [
            {
              transaction_type: 'CC',
              transaction_status: 'Success',
              amount: '50.00',
              pending: false,
              billing_address: {},
              shippingAddress: {},
            },
          ],
          meta: { next_cursor: null, prev_cursor: null, per_page: 500 },
        },
      },
    ])

    const page = await client.transactions.list('000010')

    expect(page.data).toHaveLength(1)
    expect(page.data[0]?.transactionStatus).toBe('Success')
    expect(page.hasMore()).toBe(false)
  })

  it('maps shippingAddress from camelCase key', async () => {
    const { client } = fakeClient([
      txnResponse({
        shippingAddress: { addr1: '123 Main St', city: 'Atlanta', state: 'GA', zip: '30301' },
      }),
    ])

    const txn = await client.transactions.chargeCard('000010', { amount: '10.00', token: 't' })

    expect(txn.shippingAddress.addr1).toBe('123 Main St')
    expect(txn.shippingAddress.city).toBe('Atlanta')
  })
})

describe('Transactions authorize and capture', () => {
  it('authorize POSTs the card to transaction/authorize and returns the pending transaction', async () => {
    const { client, calls } = fakeClient([
      txnResponse({
        transaction_status: 'Pending',
        transaction_number: '1234567890',
        pending: true,
      }),
    ])

    const txn = await client.transactions.authorize('000010', {
      amount: '100.50',
      token: 'tok_abc',
    })

    expect(calls[0]?.method).toBe('POST')
    expect(sentUrl(calls)).toContain('transaction/authorize')
    expect(sentBody(calls)).toEqual({
      data: { sid: '000010', amount: '100.50', token: 'tok_abc' },
    })
    expect(txn.transactionNumber).toBe('1234567890')
    expect(txn.pending).toBe(true)
  })

  it('capture POSTs transaction_id and a partial amount, and says what it took', async () => {
    const { client, calls } = fakeClient([
      {
        status: 200,
        body: {
          data: {
            message: 'Transaction captured successfully.',
            transaction_id: '1234567890',
            authorized_amount: '120.00',
            captured_amount: '50.00',
            status: 'captured',
            captured_at: '2026-10-13T15:02:11-04:00',
          },
        },
      },
    ])

    const result = await client.transactions.capture('000010', '1234567890', '50.00')

    expect(calls[0]?.method).toBe('POST')
    expect(sentUrl(calls)).toContain('transaction/capture')
    expect(sentBody(calls)).toEqual({
      data: { sid: '000010', transaction_id: '1234567890', amount: '50.00' },
    })
    expect(result).toBeInstanceOf(CaptureResult)
    expect(result).toBeInstanceOf(MessageResult)
    expect(result.message).toBe('Transaction captured successfully.')
    expect(result.transactionId).toBe('1234567890')
    expect(result.authorizedAmount).toBe('120.00')
    expect(result.capturedAmount).toBe('50.00')
    expect(result.status).toBe('captured')
    expect(result.capturedAt).toBe('2026-10-13T15:02:11-04:00')
  })

  it('capture leaves the new fields undefined against an API that only sends a message', async () => {
    const { client } = fakeClient([
      { status: 200, body: { data: { message: 'Transaction captured successfully.' } } },
    ])

    const result = await client.transactions.capture('000010', '1234567890')

    expect(result.message).toBe('Transaction captured successfully.')
    expect(result.capturedAmount).toBeUndefined()
    expect(result.status).toBeUndefined()
  })

  it.each([
    ['not_found', 'No transaction found.'],
    ['already_captured', 'Transaction is not an open authorization.'],
    ['voided', 'Transaction is not an open authorization.'],
    ['refunded', 'Transaction is not an open authorization.'],
    ['authorization_declined', 'Transaction is not an open authorization.'],
    ['not_an_authorization', 'Transaction is not an open authorization.'],
    ['amount_exceeds_authorization', 'Amount cannot be greater than the authorized amount'],
    ['some_future_code', 'Something new.'],
  ])('a refused capture (%s) throws a CaptureException with its code', async (code, message) => {
    const { client } = fakeClient([{ status: 400, body: { data: { message, code } } }])

    const error = await client.transactions.capture('000010', '1234567890').catch((e) => e)

    expect(error).toBeInstanceOf(CaptureException)
    expect(error).toBeInstanceOf(ApiException)
    expect(error.errorCode).toBe(code)
    expect(error.message).toBe(message)
    expect(error.reason).toBeUndefined()
    expect(error.statusCode).toBe(400)
  })

  it('a declined capture carries the reason', async () => {
    const { client } = fakeClient([
      {
        status: 400,
        body: {
          data: {
            message: 'Error processing capture',
            code: 'processor_declined',
            reason: 'Transaction rejected because the authorization has expired.',
          },
        },
      },
    ])

    const error = await client.transactions.capture('000010', '1234567890', '50.00').catch((e) => e)

    expect(error).toBeInstanceOf(CaptureException)
    expect(error.errorCode).toBe('processor_declined')
    expect(error.reason).toBe('Transaction rejected because the authorization has expired.')
  })

  it('a capture validation error stays a ValidationException', async () => {
    const { client } = fakeClient([
      {
        status: 400,
        body: { errors: { 'data.transaction_id': ['The data.transaction_id field is required.'] } },
      },
    ])

    const error = await client.transactions.capture('000010', '').catch((e) => e)

    expect(error).toBeInstanceOf(ValidationException)
    expect(error).not.toBeInstanceOf(CaptureException)
  })

  it('a capture refusal without a code stays an ApiException', async () => {
    const { client } = fakeClient([
      { status: 400, body: { data: { message: 'Transaction is not an open authorization.' } } },
    ])

    const error = await client.transactions.capture('000010', '1234567890').catch((e) => e)

    expect(error).toBeInstanceOf(ApiException)
    expect(error).not.toBeInstanceOf(CaptureException)
  })

  it('an idempotency refusal on a capture stays an IdempotencyException', async () => {
    const { client } = fakeClient([
      {
        status: 422,
        body: {
          data: {
            message:
              'This Idempotency-Key was already used for a different request. Use a new key for each new request.',
          },
        },
      },
    ])

    const error = await client.transactions
      .capture('000010', '1234567890', undefined, { idempotencyKey: 'k-1' })
      .catch((e) => e)

    expect(error).toBeInstanceOf(IdempotencyException)
    expect(error).not.toBeInstanceOf(CaptureException)
  })

  it('capture without an amount omits it, capturing the full authorization', async () => {
    const { client, calls } = fakeClient([
      { status: 200, body: { data: { message: 'Transaction captured successfully.' } } },
    ])

    await client.transactions.capture('000010', '1234567890')

    expect(sentBody(calls)).toEqual({ data: { sid: '000010', transaction_id: '1234567890' } })
  })
})
