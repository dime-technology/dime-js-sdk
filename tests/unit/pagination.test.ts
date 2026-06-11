import { describe, expect, it } from 'vitest'
import { fakeClient } from '../helpers.js'

function txnPage(items: unknown[], nextCursor: string | null = null) {
  return {
    status: 200,
    body: {
      data: items,
      meta: {
        next_cursor: nextCursor,
        prev_cursor: null,
        per_page: 500,
        path: 'https://app.dimepayments.com/api/transactions',
      },
    },
  }
}

const item = (amount: string) => ({
  transaction_type: 'CC',
  transaction_status: 'Success',
  amount,
  pending: false,
  billing_address: {},
  shippingAddress: {},
})

describe('Pagination', () => {
  it('hasMore is false on last page', async () => {
    const { client } = fakeClient([txnPage([item('10.00')])])

    const page = await client.transactions.list('000010')

    expect(page.hasMore()).toBe(false)
    expect(await page.next()).toBeNull()
  })

  it('hasMore is true when next_cursor is set', async () => {
    const { client } = fakeClient([txnPage([item('10.00')], 'cursor-abc')])

    const page = await client.transactions.list('000010')

    expect(page.hasMore()).toBe(true)
  })

  it('next() fetches the next page', async () => {
    const { client } = fakeClient([
      txnPage([item('10.00')], 'cursor-abc'),
      txnPage([item('20.00')]),
    ])

    const page1 = await client.transactions.list('000010')
    const page2 = await page1.next()

    expect(page2).not.toBeNull()
    expect(page2!.data[0]?.amount).toBe('20.00')
    expect(page2!.hasMore()).toBe(false)
  })

  it('autoPaging yields items across all pages without key collision', async () => {
    const { client } = fakeClient([
      txnPage([item('1.00'), item('2.00')], 'cursor-p2'),
      txnPage([item('3.00'), item('4.00')]),
    ])

    const page = await client.transactions.list('000010')
    const all: string[] = []

    for await (const txn of page.autoPaging()) {
      all.push(txn.amount ?? '')
    }

    expect(all).toEqual(['1.00', '2.00', '3.00', '4.00'])
  })

  it('length getter returns item count', async () => {
    const { client } = fakeClient([txnPage([item('1.00'), item('2.00')])])

    const page = await client.transactions.list('000010')

    expect(page.length).toBe(2)
  })

  it('for...of iterates the first page', async () => {
    const { client } = fakeClient([txnPage([item('5.00'), item('6.00')])])

    const page = await client.transactions.list('000010')
    const amounts: string[] = []
    for (const txn of page) {
      amounts.push(txn.amount ?? '')
    }

    expect(amounts).toEqual(['5.00', '6.00'])
  })

  it('pages without meta degrade gracefully', async () => {
    const { client } = fakeClient([
      { status: 200, body: { data: [{ uuid: 'c1', first_name: 'Jane', last_name: 'Doe' }] } },
    ])

    const page = await client.customers.list('000010')

    expect(page.data).toHaveLength(1)
    expect(page.hasMore()).toBe(false)
  })
})
