import { describe, expect, it } from 'vitest'
import { fakeClient, sentBody, sentQuery, sentUrl } from '../helpers.js'

const customerBody = {
  uuid: 'cust-uuid-1',
  first_name: 'Jane',
  last_name: 'Doe',
  email: 'jane@example.com',
  phone: '4045550100',
}

describe('Customers', () => {
  it('create sends envelope and maps response', async () => {
    const { client, calls } = fakeClient([{ status: 200, body: { data: customerBody } }])

    const customer = await client.customers.create('000010', {
      first_name: 'Jane',
      last_name: 'Doe',
      email: 'jane@example.com',
    })

    expect(sentUrl(calls)).toContain('customer/create')
    expect((sentBody(calls) as Record<string, unknown>)?.['data']).toMatchObject({ sid: '000010' })
    expect(customer.uuid).toBe('cust-uuid-1')
    expect(customer.firstName).toBe('Jane')
  })

  it('show sends filters in filters envelope', async () => {
    const { client, calls } = fakeClient([{ status: 200, body: { data: customerBody } }])

    await client.customers.show('000010', { uuid: 'cust-uuid-1' })

    expect(sentQuery(calls)).toEqual({
      'data[sid]': '000010',
      'filters[uuid]': 'cust-uuid-1',
    })
  })

  it('update merges attributes into data and filters separately', async () => {
    const { client, calls } = fakeClient([{ status: 200, body: { data: customerBody } }])

    await client.customers.update('000010', { uuid: 'cust-uuid-1' }, { first_name: 'Janet' })

    expect(sentBody(calls)).toEqual({
      data: { sid: '000010', first_name: 'Janet' },
      filters: { uuid: 'cust-uuid-1' },
    })
  })

  it('delete sends POST with filters envelope', async () => {
    const { client, calls } = fakeClient([{ status: 200, body: { data: { message: 'Deleted' } } }])

    const result = await client.customers.delete('000010', { uuid: 'cust-uuid-1' })

    expect(sentUrl(calls)).toContain('customer/delete')
    expect(result.message).toBe('Deleted')
  })

  it('list returns CursorPage with customers', async () => {
    const { client } = fakeClient([{ status: 200, body: { data: [customerBody], meta: {} } }])

    const page = await client.customers.list('000010')

    expect(page.data).toHaveLength(1)
    expect(page.data[0]?.uuid).toBe('cust-uuid-1')
  })
})
