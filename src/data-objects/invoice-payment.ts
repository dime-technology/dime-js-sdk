import { arrString } from '../support/arr.js'

type Raw = Record<string, unknown>

/**
 * A payment recorded against an invoice.
 *
 * `amount` is what was credited to the invoice; `coverFee` is the processing fee
 * charged on top of it, so `amount + coverFee` is what the customer actually paid.
 * It is zero unless the invoice required the customer to cover fees.
 */
export class InvoicePayment {
  constructor(
    public readonly amount?: string,
    public readonly paidAt?: string,
    public readonly method?: string,
    public readonly transactionId?: string,
    public readonly coverFee?: string,
  ) {}

  static fromRaw(data: Raw): InvoicePayment {
    return new InvoicePayment(
      arrString(data, 'amount'),
      arrString(data, 'paid_at'),
      arrString(data, 'method'),
      arrString(data, 'transaction_id'),
      arrString(data, 'cover_fee'),
    )
  }
}
