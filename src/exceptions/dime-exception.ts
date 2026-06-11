export class DimeException extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly responseBody: Record<string, unknown> = {},
    cause?: unknown,
  ) {
    super(message, { cause })
    this.name = this.constructor.name
    Object.setPrototypeOf(this, new.target.prototype)
  }

  getStatusCode(): number | undefined {
    return this.statusCode
  }

  getResponseBody(): Record<string, unknown> {
    return this.responseBody
  }
}
