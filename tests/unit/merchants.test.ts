import { describe, expect, it } from 'vitest'
import { fakeClient, sentBody } from '../helpers.js'

const merchantBody = {
  name: 'Acme Corp',
  sid: '000010',
  mcc: '5999',
  slug: 'acme-corp',
  active: true,
  g_pay: false,
  a_pay: false,
  pci_compliance: false,
}

describe('Merchants', () => {
  it('show maps response', async () => {
    const { client } = fakeClient([{ status: 200, body: { data: merchantBody } }])

    const merchant = await client.merchants.show('000010')

    expect(merchant.name).toBe('Acme Corp')
    expect(merchant.sid).toBe('000010')
    expect(merchant.active).toBe(true)
  })

  it('create does not include sid in envelope', async () => {
    const { client, calls } = fakeClient([{ status: 200, body: { data: merchantBody } }])

    await client.merchants.create({ name: 'Acme Corp', slug: 'acme-corp', mcc: '5999' })

    expect(sentBody(calls)).toEqual({
      data: { name: 'Acme Corp', slug: 'acme-corp', mcc: '5999' },
    })
  })

  it('update merges sid into data envelope', async () => {
    const { client, calls } = fakeClient([{ status: 200, body: { data: merchantBody } }])

    await client.merchants.update('000010', { name: 'Acme Corp Updated' })

    expect(sentBody(calls)).toEqual({
      data: { sid: '000010', name: 'Acme Corp Updated' },
    })
  })

  it('getFormLink returns link', async () => {
    const { client } = fakeClient([{ status: 200, body: { data: { link: 'https://onboarding.example.com/abc' } } }])

    const result = await client.merchants.getFormLink('000010')

    expect(result.link).toBe('https://onboarding.example.com/abc')
  })

  it('list returns CursorPage', async () => {
    const { client } = fakeClient([
      { status: 200, body: { data: [merchantBody], meta: {} } },
    ])

    const page = await client.merchants.list()

    expect(page.data[0]?.name).toBe('Acme Corp')
  })
})
