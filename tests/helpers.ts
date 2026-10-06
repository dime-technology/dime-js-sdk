import { Client } from '../src/client.js'
import { Config } from '../src/config.js'

export type MockResponse = { status: number; body: unknown; headers?: Record<string, string> }
export type Call = { url: string; method: string; body: unknown; headers: Record<string, string> }

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
    } else if (init?.body instanceof FormData) {
      body = init.body
    }

    const headers: Record<string, string> = {}
    if (init?.headers) {
      for (const [k, v] of Object.entries(init.headers as Record<string, string>)) {
        headers[k] = v
      }
    }

    calls.push({ url, method: init?.method ?? 'GET', body, headers })

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

export function sentForm(calls: Call[], index = 0): FormData {
  const body = calls[index]?.body
  if (!(body instanceof FormData)) throw new Error(`Call ${index} did not send a FormData body`)
  return body
}

export function sentUrl(calls: Call[], index = 0): string {
  return calls[index]?.url ?? ''
}

export function sentQuery(calls: Call[], index = 0): Record<string, string> {
  const url = calls[index]?.url ?? ''
  const q = url.slice(url.indexOf('?') + 1)
  return url.includes('?') ? Object.fromEntries(new URLSearchParams(q)) : {}
}

export function sentHeaders(calls: Call[], index = 0): Record<string, string> {
  return calls[index]?.headers ?? {}
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
