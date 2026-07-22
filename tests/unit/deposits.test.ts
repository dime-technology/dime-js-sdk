import { describe, expect, it } from 'vitest'
import { fakeClient, sentQuery } from '../helpers.js'

describe('Deposits', () => {
  it('list returns CursorPage of deposits', async () => {
    const { client } = fakeClient([
      {
        status: 200,
        body: {
          data: [{ sweep_id: 'SWP001', net_amount: '1500.00', type: 'CC' }],
          meta: {},
        },
      },
    ])

    const page = await client.deposits.list('000010')

    expect(page.data[0]?.sweepId).toBe('SWP001')
    expect(page.data[0]?.netAmount).toBe('1500.00')
  })

  it('listWithTransactions returns DepositGroup', async () => {
    const { client } = fakeClient([
      {
        status: 200,
        body: {
          data: {
            sid: '000010',
            count: 1,
            deposits: {
              SWP001: {
                sid: '000010',
                sweep_id: 'SWP001',
                transactions: [],
              },
            },
          },
        },
      },
    ])

    const group = await client.deposits.listWithTransactions('000010', {
      start_date: '2026-01-01 00:00:00',
      end_date: '2026-01-31 23:59:59',
    })

    expect(group.sid).toBe('000010')
    expect(group.deposits).toHaveLength(1)
  })

  it('show sends identifier in data envelope', async () => {
    const { client, calls } = fakeClient([
      { status: 200, body: { data: { sid: '000010', transactions: [] } } },
    ])

    await client.deposits.show('000010', { sweep_id: 'SWP001' })

    expect(sentQuery(calls)).toEqual({ 'data[sid]': '000010', 'data[sweep_id]': 'SWP001' })
  })
})
