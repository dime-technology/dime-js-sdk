import { arrString } from '../support/arr.js'

type Raw = Record<string, unknown>

export class InvoicePayment {
  constructor(
    public readonly amount?: string,
    public readonly paidAt?: string,
    public readonly method?: string,
    public readonly transactionId?: string,
  ) {}

  static fromRaw(data: Raw): InvoicePayment {
    return new InvoicePayment(
      arrString(data, 'amount'),
      arrString(data, 'paid_at'),
      arrString(data, 'method'),
      arrString(data, 'transaction_id'),
    )
  }
}
