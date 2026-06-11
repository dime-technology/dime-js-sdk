import { describe, expect, it } from 'vitest'
import { fakeClient, sentBody } from '../helpers.js'

const addrBody = {
  address_id: 7,
  recipient: 'Jane Doe',
  line_one: '123 Main St',
  city: 'Atlanta',
  state: 'GA',
  zip: '30301',
}

describe('Addresses', () => {
  it('create sends sid, uuid, and attributes in data envelope', async () => {
    const { client, calls } = fakeClient([{ status: 200, body: { data: addrBody } }])

    const addr = await client.addresses.create('000010', 'cust-uuid-1', {
      recipient: 'Jane Doe',
      line_one: '123 Main St',
      city: 'Atlanta',
      state: 'GA',
      zip: '30301',
    })

    expect(sentBody(calls)).toEqual({
      data: {
        sid: '000010',
        uuid: 'cust-uuid-1',
        recipient: 'Jane Doe',
        line_one: '123 Main St',
        city: 'Atlanta',
        state: 'GA',
        zip: '30301',
      },
    })
    expect(addr.id).toBe(7)
    expect(addr.lineOne).toBe('123 Main St')
  })

  it('show sends address_id in data envelope', async () => {
    const { client, calls } = fakeClient([{ status: 200, body: { data: addrBody } }])

    await client.addresses.show('000010', 'cust-uuid-1', 7)

    expect(sentBody(calls)).toEqual({
      data: { sid: '000010', uuid: 'cust-uuid-1', address_id: 7 },
    })
  })

  it('delete returns MessageResult', async () => {
    const { client } = fakeClient([{ status: 200, body: { data: { message: 'Address deleted' } } }])

    const result = await client.addresses.delete('000010', 'cust-uuid-1', 7)

    expect(result.message).toBe('Address deleted')
  })

  it('list returns CursorPage', async () => {
    const { client } = fakeClient([
      { status: 200, body: { data: [{ id: 7, recipient: 'Jane', line_one: '123 Main' }], meta: {} } },
    ])

    const page = await client.addresses.list('000010', 'cust-uuid-1')

    expect(page.data[0]?.id).toBe(7)
  })
})
