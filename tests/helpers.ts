import { Client } from '../src/client.js'
import { Config } from '../src/config.js'

export type MockResponse = { status: number; body: unknown; headers?: Record<string, string> }
export type Call = { url: string; method: string; body: unknown }

export function createMockFetch(responses: MockResponse[]) {
  let callIndex = 0
  const calls: Call[] = []

  const mockFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const response = responses[callIndex++]
    if (!response) throw new Error(`No mock response queued for call ${callIndex}`)

    const url =
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.toString()
          : (input as Request).url

    let body: unknown = undefined
    if (init?.body && typeof init.body === 'string') {
      try {
        body = JSON.parse(init.body)
      } catch {
        body = init.body
      }
    }

    calls.push({ url, method: init?.method ?? 'GET', body })

    return new Response(JSON.stringify(response.body), {
      status: response.status,
      headers: { 'Content-Type': 'application/json', ...(response.headers ?? {}) },
    })
  }

  return { mockFetch, calls }
}

export function fakeClient(responses: MockResponse[]) {
  const { mockFetch, calls } = createMockFetch(responses)
  const client = new Client(
    new Config({
      token: 'test-token',
      fetch: mockFetch as unknown as typeof globalThis.fetch,
      sleep: () => Promise.resolve(),
    }),
  )
  return { client, calls }
}

export function sentBody(calls: Call[], index = 0): unknown {
  return calls[index]?.body
}

export function sentUrl(calls: Call[], index = 0): string {
  return calls[index]?.url ?? ''
}

export function txnResponse(overrides: Record<string, unknown> = {}) {
  return {
    status: 200,
    body: {
      data: {
        transaction_type: 'CC',
        transaction_status: 'Success',
        transaction_number: 'TXN123',
        amount: '100.00',
        pending: false,
        billing_address: {},
        shippingAddress: {},
        ...overrides,
      },
    },
  }
}
