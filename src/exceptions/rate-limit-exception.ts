import { DimeException } from './dime-exception.js'

export class RateLimitException extends DimeException {
  constructor(
    message: string,
    public readonly retryAfter?: number,
    statusCode = 429,
    responseBody: Record<string, unknown> = {},
    cause?: unknown,
  ) {
    super(message, statusCode, responseBody, cause)
  }

  getRetryAfter(): number | undefined {
    return this.retryAfter
  }
}
