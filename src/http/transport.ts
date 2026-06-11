import { Config, VERSION } from '../config.js'
import { ConnectionException } from '../exceptions/index.js'
import { handleError } from './error-handler.js'

type Raw = Record<string, unknown>

export class Transport {
  private readonly fetchFn: typeof globalThis.fetch
  private readonly sleepFn: (ms: number) => Promise<void>

  constructor(private readonly config: Config) {
    this.fetchFn = config.fetch ?? globalThis.fetch
    this.sleepFn =
      config.sleep ?? ((ms) => new Promise((resolve) => setTimeout(resolve, ms)))
  }

  /**
   * Execute a request and return the decoded JSON body.
   *
   * The Dime API expects request parameters in the JSON body even for GET
   * requests; this transport always sends the payload as a JSON body regardless
   * of HTTP method, matching the server's expectation.
   */
  async request(
    method: string,
    path: string,
    body: Raw = {},
    query: Record<string, string> = {},
  ): Promise<Raw> {
    let url = `${this.config.baseUri()}${path.replace(/^\//, '')}`

    if (Object.keys(query).length > 0) {
      url += '?' + new URLSearchParams(query).toString()
    }

    const hasBody = Object.keys(body).length > 0
    const init: RequestInit = {
      method,
      headers: {
        Authorization: `Bearer ${this.config.token}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-Dime-Sdk': `dime-js-sdk/${VERSION}`,
      },
      ...(hasBody ? { body: JSON.stringify(body) } : {}),
    }

    return this.attempt(url, init, 0)
  }

  private async attempt(url: string, init: RequestInit, attempt: number): Promise<Raw> {
    let response: Response

    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), this.config.timeout * 1_000)
      try {
        response = await this.fetchFn(url, { ...init, signal: controller.signal })
      } finally {
        clearTimeout(timer)
      }
    } catch (err) {
      const isAbort = err instanceof Error && err.name === 'AbortError'
      const label = isAbort ? `Request timed out after ${this.config.timeout}s` : `Could not reach the Dime API: ${err instanceof Error ? err.message : String(err)}`

      if (attempt < this.config.maxRetries) {
        await this.sleep(attempt, undefined)
        return this.attempt(url, init, attempt + 1)
      }

      throw new ConnectionException(label, undefined, {}, err instanceof Error ? err : undefined)
    }

    const status = response.status

    if ((status === 429 || status >= 500) && attempt < this.config.maxRetries) {
      const retryAfter = parseRetryAfter(response)
      await this.sleep(attempt, retryAfter)
      return this.attempt(url, init, attempt + 1)
    }

    const decoded = await decode(response)

    if (status < 200 || status >= 300) {
      handleError(status, decoded, parseRetryAfter(response))
    }

    return decoded
  }

  private async sleep(attempt: number, retryAfter: number | undefined): Promise<void> {
    const ms =
      retryAfter !== undefined
        ? retryAfter * 1_000
        : Math.min(2 ** attempt * this.config.retryBaseDelay * 1_000, 30_000)
    await this.sleepFn(ms)
  }
}

function parseRetryAfter(response: Response): number | undefined {
  const header = response.headers.get('Retry-After')
  if (header !== null && /^\d+$/.test(header)) return parseInt(header, 10)
  return undefined
}

async function decode(response: Response): Promise<Raw> {
  const text = await response.text()
  if (!text) return {}

  try {
    const parsed: unknown = JSON.parse(text)
    if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
      return parsed as Raw
    }
    return { message: text }
  } catch {
    return { message: text }
  }
}
