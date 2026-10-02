export const DEFAULT_BASE_URL = 'https://app.dimepayments.com'
export const VERSION = '1.3.1'

export interface ConfigOptions {
  /** Sanctum personal access token (sent as Bearer). */
  token: string
  /** Base URL; defaults to https://app.dimepayments.com. */
  baseUrl?: string
  /** Per-request timeout in seconds. Default 30. */
  timeout?: number
  /** How many times to retry 429/5xx/network errors. Default 2. */
  maxRetries?: number
  /** Base seconds for exponential backoff. Default 0.5. */
  retryBaseDelay?: number
  /** Custom fetch implementation — inject a mock in tests. */
  fetch?: typeof globalThis.fetch
  /** Custom sleep implementation — inject a no-op in tests to skip delays. */
  sleep?: (ms: number) => Promise<void>
}

export class Config {
  readonly token: string
  readonly baseUrl: string
  readonly timeout: number
  readonly maxRetries: number
  readonly retryBaseDelay: number
  readonly fetch?: typeof globalThis.fetch
  readonly sleep?: (ms: number) => Promise<void>

  constructor(options: ConfigOptions | string, baseUrl?: string) {
    if (typeof options === 'string') {
      this.token = options
      this.baseUrl = baseUrl ?? DEFAULT_BASE_URL
      this.timeout = 30
      this.maxRetries = 2
      this.retryBaseDelay = 0.5
    } else {
      this.token = options.token
      this.baseUrl = options.baseUrl ?? DEFAULT_BASE_URL
      this.timeout = options.timeout ?? 30
      this.maxRetries = options.maxRetries ?? 2
      this.retryBaseDelay = options.retryBaseDelay ?? 0.5
      this.fetch = options.fetch
      this.sleep = options.sleep
    }
  }

  baseUri(): string {
    return `${this.baseUrl.replace(/\/$/, '')}/api/`
  }
}
