import { DimeException } from './dime-exception.js'

export class ValidationException extends DimeException {
  constructor(
    message: string,
    public readonly errors: Record<string, string[]> = {},
    statusCode?: number,
    responseBody: Record<string, unknown> = {},
    cause?: unknown,
  ) {
    super(message, statusCode, responseBody, cause)
  }

  getErrors(): Record<string, string[]> {
    return this.errors
  }

  firstError(): string | undefined {
    for (const messages of Object.values(this.errors)) {
      if (messages.length > 0) return messages[0]
    }
    return undefined
  }
}
