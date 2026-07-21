import { arrString } from '../support/arr.js'

type Raw = Record<string, unknown>

export class InvoiceEvent {
  constructor(
    public readonly type?: string,
    public readonly label?: string,
    public readonly description?: string,
    public readonly createdAt?: string,
  ) {}

  static fromRaw(data: Raw): InvoiceEvent {
    return new InvoiceEvent(
      arrString(data, 'type'),
      arrString(data, 'label'),
      arrString(data, 'description'),
      arrString(data, 'created_at'),
    )
  }
}
