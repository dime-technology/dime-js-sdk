import { describe, expect, it } from 'vitest'
import { fakeClient, sentBody, sentQuery, sentUrl } from '../helpers.js'

const planBody = {
  id: 3,
  name: 'Monthly Membership',
  description: 'All-access membership',
  recurrence_schedule: 'Monthly',
  status: 'draft',
  subtotal: 25,
  total: 25,
  token: 'ElZCvdINMjyYHjCQ4oNCuIBYZrG1s9Gone7oOpkY',
  public_url: 'https://app.dimepayments.com/subscribe/ElZCvdINMjyYHjCQ4oNCuIBYZrG1s9Gone7oOpkY',
  allow_public: true,
  created_at: '2026-09-01T10:00:00+00:00',
  items: [{ name: 'Membership', description: null, quantity: 1, unit_price: 25 }],
}

const lines = [{ item_id: 96, name: 'Membership', quantity: 1, unit_price: 25 }]

describe('SubscriptionPlans', () => {
  it('list sends status in the data envelope (not filters) and returns a CursorPage', async () => {
    const { client, calls } = fakeClient([{ status: 200, body: { data: [planBody], meta: {} } }])

    const page = await client.subscriptionPlans.list('000010', 'active')

    expect(sentUrl(calls)).toContain('subscription-plan/list')
    expect(sentQuery(calls)).toEqual({ 'data[sid]': '000010', 'data[status]': 'active' })
    expect(page.data[0]?.name).toBe('Monthly Membership')
  })

  it('list without a status sends only the sid', async () => {
    const { client, calls } = fakeClient([{ status: 200, body: { data: [], meta: {} } }])

    await client.subscriptionPlans.list('000010')

    expect(sentQuery(calls)).toEqual({ 'data[sid]': '000010' })
  })

  it('show sends subscription_plan_id and maps the plan and its items', async () => {
    const { client, calls } = fakeClient([{ status: 200, body: { data: planBody } }])

    const plan = await client.subscriptionPlans.show('000010', 3)

    expect(sentQuery(calls)).toEqual({ 'data[sid]': '000010', 'data[subscription_plan_id]': '3' })
    expect(plan.id).toBe(3)
    expect(plan.recurrenceSchedule).toBe('Monthly')
    expect(plan.total).toBe('25')
    expect(plan.allowPublic).toBe(true)
    expect(plan.publicUrl).toContain('/subscribe/')
    expect(plan.items[0]?.name).toBe('Membership')
    expect(plan.items[0]?.unitPrice).toBe('25')
    expect(plan.items[0]?.description).toBeUndefined()
  })

  it('create POSTs the plan with its lines', async () => {
    const { client, calls } = fakeClient([{ status: 201, body: { data: planBody } }])

    const plan = await client.subscriptionPlans.create('000010', {
      name: 'Monthly Membership',
      recurrence_schedule: 'Monthly',
      lines,
    })

    expect(calls[0]?.method).toBe('POST')
    expect(sentUrl(calls)).toContain('subscription-plan/create')
    expect(sentBody(calls)).toEqual({
      data: { sid: '000010', name: 'Monthly Membership', recurrence_schedule: 'Monthly', lines },
    })
    expect(plan.status).toBe('draft')
  })

  it('edit PATCHes subscription_plan_id with the full plan', async () => {
    const { client, calls } = fakeClient([{ status: 200, body: { data: planBody } }])

    await client.subscriptionPlans.edit('000010', 3, {
      name: 'Monthly Membership',
      recurrence_schedule: 'Monthly',
      lines,
    })

    expect(calls[0]?.method).toBe('PATCH')
    expect(sentUrl(calls)).toContain('subscription-plan/edit')
    expect(sentBody(calls)).toEqual({
      data: {
        sid: '000010',
        subscription_plan_id: 3,
        name: 'Monthly Membership',
        recurrence_schedule: 'Monthly',
        lines,
      },
    })
  })

  it('delete POSTs and returns a MessageResult', async () => {
    const { client, calls } = fakeClient([
      { status: 200, body: { data: { message: 'Subscription plan deleted' } } },
    ])

    const result = await client.subscriptionPlans.delete('000010', 3)

    expect(calls[0]?.method).toBe('POST')
    expect(sentBody(calls)).toEqual({ data: { sid: '000010', subscription_plan_id: 3 } })
    expect(result.message).toBe('Subscription plan deleted')
  })

  it.each([
    ['publish', 'subscription-plan/publish'],
    ['archive', 'subscription-plan/archive'],
    ['unarchive', 'subscription-plan/unarchive'],
  ] as const)('%s PATCHes subscription_plan_id to %s', async (method, path) => {
    const { client, calls } = fakeClient([{ status: 200, body: { data: planBody } }])

    const plan = await client.subscriptionPlans[method]('000010', 3)

    expect(calls[0]?.method).toBe('PATCH')
    expect(sentUrl(calls)).toContain(path)
    expect(sentBody(calls)).toEqual({ data: { sid: '000010', subscription_plan_id: 3 } })
    expect(plan.id).toBe(3)
  })

  it('subscribe POSTs the customer and payment method and maps the new subscription', async () => {
    const { client, calls } = fakeClient([
      {
        status: 201,
        body: {
          data: {
            subscription_id: 10,
            status: 'Active',
            next_run_date: '2026-11-06',
            transaction_number: 'TXN-123',
            amount: 25.0,
          },
        },
      },
    ])

    const result = await client.subscriptionPlans.subscribe('000010', 3, 'cust-uuid-1', 42)

    expect(calls[0]?.method).toBe('POST')
    expect(sentUrl(calls)).toContain('subscription-plan/subscribe')
    expect(sentBody(calls)).toEqual({
      data: {
        sid: '000010',
        subscription_plan_id: 3,
        customer_uuid: 'cust-uuid-1',
        payment_method: 42,
      },
    })
    expect(result.subscriptionId).toBe(10)
    expect(result.status).toBe('Active')
    expect(result.nextRunDate).toBe('2026-11-06')
    expect(result.transactionNumber).toBe('TXN-123')
    expect(result.amount).toBe('25')
  })
})
