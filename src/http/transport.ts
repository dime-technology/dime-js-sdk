import { Config, VERSION } from '../config.js'
import { ConnectionException } from '../exceptions/index.js'
import { handleError } from './error-handler.js'

type Raw = Record<string, unknown>

export interface MultipartFile {
  /** The form field name, e.g. `files[]`. */
  field: string
  content: Blob
  filename: string
}

export class Transport {
  private readonly fetchFn: typeof globalThis.fetch
  private readonly sleepFn: (ms: number) => Promise<void>

  constructor(private readonly config: Config) {
    this.fetchFn = config.fetch ?? globalThis.fetch
    this.sleepFn = config.sleep ?? ((ms) => new Promise((resolve) => setTimeout(resolve, ms)))
  }

  /**
   * Execute a request and return the decoded JSON body.
   *
   * The Dime API reads the same `{ data, filters }` envelope whether it arrives
   * as a JSON body or as nested query parameters. The Fetch standard forbids a
   * body on GET/HEAD (undici throws), so for those methods the envelope is
   * serialised into the query string (`data[sid]=…&filters[status]=…`) and no
   * body is sent; every other method sends the envelope as a JSON body.
   */
  async request(
    method: string,
    path: string,
    body: Raw = {},
    query: Record<string, string> = {},
  ): Promise<Raw> {
    let url = `${this.config.baseUri()}${path.replace(/^\//, '')}`

    const bodyless = method.toUpperCase() === 'GET' || method.toUpperCase() === 'HEAD'

    const params: Record<string, string> = { ...query }
    if (bodyless) Object.assign(params, flattenParams(body))

    if (Object.keys(params).length > 0) {
      url += '?' + new URLSearchParams(params).toString()
    }

    const sendBody = !bodyless && Object.keys(body).length > 0
    const headers = this.headers()
    // Only advertise a JSON body when we actually send one; otherwise the API
    // tries to parse the empty body and rejects the request with "Invalid JSON".
    if (sendBody) headers['Content-Type'] = 'application/json'

    const init: RequestInit = {
      method,
      headers,
      ...(sendBody ? { body: JSON.stringify(body) } : {}),
    }

    return this.attempt(url, init, 0)
  }

  /**
   * Execute a `multipart/form-data` request and return the decoded JSON body.
   *
   * Multipart has no JSON parsing, so the envelope is sent as bracketed form
   * fields (`data[sid]=…`) — a single `data` field holding JSON would be read
   * as a plain string. No Content-Type is set here: fetch derives it, boundary
   * included, from the FormData body.
   */
  async requestMultipart(
    method: string,
    path: string,
    body: Raw,
    files: MultipartFile[],
  ): Promise<Raw> {
    const url = `${this.config.baseUri()}${path.replace(/^\//, '')}`

    const form = new FormData()
    for (const [name, value] of Object.entries(flattenParams(body))) {
      form.append(name, value)
    }
    for (const file of files) {
      form.append(file.field, file.content, file.filename)
    }

    return this.attempt(url, { method, headers: this.headers(), body: form }, 0)
  }

  private headers(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.config.token}`,
      Accept: 'application/json',
      'X-Dime-Sdk': `dime-js-sdk/${VERSION}`,
    }
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
      const label = isAbort
        ? `Request timed out after ${this.config.timeout}s`
        : `Could not reach the Dime API: ${err instanceof Error ? err.message : String(err)}`

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

/**
 * Flatten a nested envelope into PHP-style bracketed query pairs, e.g.
 * `{ data: { sid: '1' }, filters: { status: 'all' } }` becomes
 * `{ 'data[sid]': '1', 'filters[status]': 'all' }`. Booleans follow the same
 * '1'/'0' convention the API uses elsewhere; null/undefined are dropped.
 */
function flattenParams(obj: Raw, prefix = ''): Record<string, string> {
  const out: Record<string, string> = {}

  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined) continue

    const name = prefix ? `${prefix}[${key}]` : key

    if (Array.isArray(value)) {
      value.forEach((item, i) => {
        Object.assign(out, flattenParams({ [i]: item }, name))
      })
    } else if (typeof value === 'object') {
      Object.assign(out, flattenParams(value as Raw, name))
    } else {
      out[name] = typeof value === 'boolean' ? (value ? '1' : '0') : String(value)
    }
  }

  return out
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
