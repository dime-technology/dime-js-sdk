import { describe, expect, it } from 'vitest'
import { ApiException } from '../../src/exceptions/index.js'
import { fakeClient, sentBody, sentQuery, sentUrl } from '../helpers.js'

const releaseBody = (overrides: Record<string, unknown> = {}) => ({
  id: 42,
  amount: 1500,
  fee: 30,
  status: 'released',
  status_label: 'Released',
  idempotency_key: 'payout-2026-09-25-0001',
  transaction_info_ids: null,
  failure_reason: null,
  requested_at: '2026-09-25T14:02:11+00:00',
  completed_at: '2026-09-25T14:02:12+00:00',
  ...overrides,
})

describe('Funds', () => {
  it('balance sends sid as a query param and maps the held balance', async () => {
    const { client, calls } = fakeClient([
      {
        status: 200,
        body: {
          data: {
            sid: '91828382',
            available: 6492.87,
            pending: 0,
            reserve: 0,
            at_risk: 1250,
            owed_to_split: 40.15,
            unresolved: 0,
            release_fee: 30,
            releasable: 5172.72,
            ach_settlement_days: 7,
            ach_out_enabled: true,
            ach_out_limit_remaining: 19999999.99,
          },
        },
      },
    ])

    const balance = await client.funds.balance('91828382')

    expect(sentUrl(calls)).toContain('funds/balance')
    expect(sentQuery(calls)).toEqual({ 'data[sid]': '91828382' })
    expect(balance.available).toBe('6492.87')
    expect(balance.atRisk).toBe('1250')
    expect(balance.owedToSplit).toBe('40.15')
    expect(balance.releasable).toBe('5172.72')
    expect(balance.achSettlementDays).toBe(7)
    expect(balance.achOutEnabled).toBe(true)
    expect(balance.achOutLimitRemaining).toBe('19999999.99')
  })

  it('transactions maps the releasable payments', async () => {
    const { client, calls } = fakeClient([
      {
        status: 200,
        body: {
          data: {
            sid: '91828382',
            transactions: [
              {
                transaction_info_id: '1297431',
                type: 'CC',
                transaction_date: '2026-09-28T15:12:09+00:00',
                gross_amount: 100,
                net_amount: 97,
                split_amount: 1.25,
                amount: 95.75,
              },
            ],
            total: 95.75,
            truncated: false,
          },
        },
      },
    ])

    const releasable = await client.funds.transactions('91828382')

    expect(sentUrl(calls)).toContain('funds/transactions')
    expect(releasable.transactions[0]?.transactionInfoId).toBe('1297431')
    expect(releasable.transactions[0]?.splitAmount).toBe('1.25')
    expect(releasable.transactions[0]?.amount).toBe('95.75')
    expect(releasable.total).toBe('95.75')
    expect(releasable.truncated).toBe(false)
  })

  it('release POSTs the idempotency key with the amount and maps the release', async () => {
    const { client, calls } = fakeClient([
      {
        status: 201,
        body: { data: { sid: '91828382', replayed: false, release: releaseBody() } },
      },
    ])

    const result = await client.funds.release('91828382', 'payout-2026-09-25-0001', {
      amount: '1500.00',
    })

    expect(calls[0]?.method).toBe('POST')
    expect(sentUrl(calls)).toContain('funds/release')
    expect(sentBody(calls)).toEqual({
      data: { sid: '91828382', idempotency_key: 'payout-2026-09-25-0001', amount: '1500.00' },
    })
    expect(result.replayed).toBe(false)
    expect(result.release.id).toBe(42)
    expect(result.release.status).toBe('released')
    expect(result.release.amount).toBe('1500')
    expect(result.release.fee).toBe('30')
    expect(result.release.transactionInfoIds).toEqual([])
    expect(result.release.failureReason).toBeUndefined()
  })

  it('release by transaction_info_ids sends the list and maps it back', async () => {
    const { client, calls } = fakeClient([
      {
        status: 200,
        body: {
          data: {
            sid: '91828382',
            replayed: true,
            release: releaseBody({ transaction_info_ids: ['1297431', '1297455'] }),
          },
        },
      },
    ])

    const result = await client.funds.release('91828382', 'payout-2', {
      transaction_info_ids: ['1297431', '1297455'],
    })

    expect(sentBody(calls)).toEqual({
      data: {
        sid: '91828382',
        idempotency_key: 'payout-2',
        transaction_info_ids: ['1297431', '1297455'],
      },
    })
    expect(result.replayed).toBe(true)
    expect(result.release.transactionInfoIds).toEqual(['1297431', '1297455'])
  })

  it('release returns a declined release (422 with a release record) instead of throwing', async () => {
    const { client } = fakeClient([
      {
        status: 422,
        body: {
          data: {
            sid: '91828382',
            replayed: false,
            release: releaseBody({
              status: 'failed',
              status_label: 'Failed',
              failure_reason: 'Insufficient funds',
              completed_at: null,
            }),
          },
        },
      },
    ])

    const result = await client.funds.release('91828382', 'payout-3', { amount: 10 })

    expect(result.release.status).toBe('failed')
    expect(result.release.failureReason).toBe('Insufficient funds')
  })

  it('release throws ApiException with the detail when nothing was released', async () => {
    const body = {
      data: {
        message: 'One of those transactions cannot be released. Nothing was released.',
        ineligible: [{ transaction_info_id: '1297455', reason: 'ACH payments are held.' }],
      },
    }
    const { client } = fakeClient([{ status: 422, body }])

    const error = await client.funds
      .release('91828382', 'payout-4', { transaction_info_ids: ['1297455'] })
      .catch((e: unknown) => e)

    expect(error).toBeInstanceOf(ApiException)
    expect((error as ApiException).message).toBe(body.data.message)
    expect((error as ApiException).getResponseBody()).toEqual(body)
  })
})
