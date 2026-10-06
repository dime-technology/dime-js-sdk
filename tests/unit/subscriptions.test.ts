import { describe, expect, it } from 'vitest'
import { fakeClient, sentBody, sentQuery, sentUrl } from '../helpers.js'

const subscriptionBody = {
  id: 7,
  subscription_plan_id: 3,
  plan_name: 'Monthly Membership',
  amount: '25.00',
  recurrence_schedule: 'Monthly',
  start_date: '2026-08-01 00:00:00',
  end_date: null,
  last_run_date: '2026-09-01 00:00:00',
  last_run_status: 'Success',
  last_run_failed_count: 0,
  next_run_date: '2026-10-01 00:00:00',
  status: 'Active',
  paused_until_date: null,
  cancelled_at: null,
  cancelled_by: null,
  customer_uuid: 'cust-uuid-1',
  error: null,
  payment_method: { id: 42, type: 'cc', last_four: '1111', expiration: '01/2027' },
  items: [{ name: 'Membership', description: null, quantity: 1, unit_price: 25, amount: 25 }],
}

describe('Subscriptions', () => {
  it('list sends filters as query params and returns a CursorPage', async () => {
    const { client, calls } = fakeClient([
      { status: 200, body: { data: [{ ...subscriptionBody, items: undefined }], meta: {} } },
    ])

    const page = await client.subscriptions.list('000010', {
      status: 'Active',
      customer_uuid: 'cust-uuid-1',
    })

    expect(sentUrl(calls)).toContain('subscription/list')
    expect(sentQuery(calls)).toEqual({
      'data[sid]': '000010',
      'filters[status]': 'Active',
      'filters[customer_uuid]': 'cust-uuid-1',
    })
    expect(page.data[0]?.planName).toBe('Monthly Membership')
    expect(page.data[0]?.items).toEqual([])
  })

  it('show sends subscription_id and maps the payment method and items', async () => {
    const { client, calls } = fakeClient([{ status: 200, body: { data: subscriptionBody } }])

    const subscription = await client.subscriptions.show('000010', 7)

    expect(sentQuery(calls)).toEqual({ 'data[sid]': '000010', 'data[subscription_id]': '7' })
    expect(subscription.id).toBe(7)
    expect(subscription.subscriptionPlanId).toBe(3)
    expect(subscription.amount).toBe('25.00')
    expect(subscription.lastRunFailedCount).toBe(0)
    expect(subscription.customerUuid).toBe('cust-uuid-1')
    expect(subscription.paymentMethod.lastFour).toBe('1111')
    expect(subscription.items[0]?.amount).toBe('25')
  })

  it('pause PATCHes pause_until_date', async () => {
    const { client, calls } = fakeClient([
      { status: 200, body: { data: { ...subscriptionBody, status: 'Paused' } } },
    ])

    const subscription = await client.subscriptions.pause('000010', 7, '2026-12-01')

    expect(calls[0]?.method).toBe('PATCH')
    expect(sentUrl(calls)).toContain('subscription/pause')
    expect(sentBody(calls)).toEqual({
      data: { sid: '000010', subscription_id: 7, pause_until_date: '2026-12-01' },
    })
    expect(subscription.status).toBe('Paused')
  })

  it('pause without a date omits pause_until_date, pausing indefinitely', async () => {
    const { client, calls } = fakeClient([{ status: 200, body: { data: subscriptionBody } }])

    await client.subscriptions.pause('000010', 7)

    expect(sentBody(calls)).toEqual({ data: { sid: '000010', subscription_id: 7 } })
  })

  it.each([
    ['resume', 'subscription/resume'],
    ['cancel', 'subscription/cancel'],
  ] as const)('%s PATCHes subscription_id to %s', async (method, path) => {
    const { client, calls } = fakeClient([{ status: 200, body: { data: subscriptionBody } }])

    await client.subscriptions[method]('000010', 7)

    expect(calls[0]?.method).toBe('PATCH')
    expect(sentUrl(calls)).toContain(path)
    expect(sentBody(calls)).toEqual({ data: { sid: '000010', subscription_id: 7 } })
  })
})
