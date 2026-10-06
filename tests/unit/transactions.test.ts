import { describe, expect, it } from 'vitest'
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

  it('capture POSTs transaction_id and a partial amount', async () => {
    const { client, calls } = fakeClient([
      { status: 200, body: { data: { message: 'Transaction captured successfully.' } } },
    ])

    const result = await client.transactions.capture('000010', '1234567890', '50.00')

    expect(calls[0]?.method).toBe('POST')
    expect(sentUrl(calls)).toContain('transaction/capture')
    expect(sentBody(calls)).toEqual({
      data: { sid: '000010', transaction_id: '1234567890', amount: '50.00' },
    })
    expect(result.message).toBe('Transaction captured successfully.')
  })

  it('capture without an amount omits it, capturing the full authorization', async () => {
    const { client, calls } = fakeClient([
      { status: 200, body: { data: { message: 'Transaction captured successfully.' } } },
    ])

    await client.transactions.capture('000010', '1234567890')

    expect(sentBody(calls)).toEqual({ data: { sid: '000010', transaction_id: '1234567890' } })
  })
})
