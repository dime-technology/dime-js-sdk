import { arrArrayFrom, arrBool, arrInt, arrObjectFrom, arrString } from '../support/arr.js'
import { CoverFeeQuote } from './cover-fee-quote.js'
import { InvoiceCustomer } from './invoice-customer.js'
import { InvoiceEvent } from './invoice-event.js'
import { InvoiceLineItem } from './invoice-line-item.js'
import { InvoicePayment } from './invoice-payment.js'

type Raw = Record<string, unknown>

export class Invoice {
  constructor(
    public readonly id?: number,
    public readonly invoiceNumber?: string,
    public readonly status?: string,
    public readonly token?: string,
    public readonly paymentTerms?: string,
    public readonly issueDate?: string,
    public readonly dueDate?: string,
    public readonly isOverdue: boolean = false,
    public readonly subtotal?: string,
    public readonly total?: string,
    public readonly amountPaid?: string,
    public readonly balance?: string,
    public readonly allowPartialPayment: boolean = false,
    public readonly thankYouNote?: string,
    // Present on the list-summary shape; the full shape nests these under `customer`.
    public readonly customerName?: string,
    public readonly customerEmail?: string,
    public readonly publicUrl?: string,
    public readonly customer: InvoiceCustomer = new InvoiceCustomer(),
    public readonly items: InvoiceLineItem[] = [],
    public readonly payments: InvoicePayment[] = [],
    public readonly events: InvoiceEvent[] = [],
    // Whether the customer must pay the processing fee. The fee is not a line item
    // and not part of `total` — see CoverFeeQuote. Appended rather than slotted in
    // beside allowPartialPayment so the positional constructor stays compatible.
    public readonly coverFeeRequired: boolean = false,
    public readonly coverFeeQuote?: CoverFeeQuote,
  ) {}

  static fromRaw(data: Raw): Invoice {
    return new Invoice(
      arrInt(data, 'id'),
      arrString(data, 'invoice_number'),
      arrString(data, 'status'),
      arrString(data, 'token'),
      arrString(data, 'payment_terms'),
      arrString(data, 'issue_date'),
      arrString(data, 'due_date'),
      arrBool(data, 'is_overdue'),
      arrString(data, 'subtotal'),
      arrString(data, 'total'),
      arrString(data, 'amount_paid'),
      arrString(data, 'balance'),
      arrBool(data, 'allow_partial_payment'),
      arrString(data, 'thank_you_note'),
      arrString(data, 'customer_name'),
      arrString(data, 'customer_email'),
      arrString(data, 'public_url'),
      InvoiceCustomer.fromRaw(arrObjectFrom(data, ['customer'])),
      arrArrayFrom(data, 'items').map(InvoiceLineItem.fromRaw),
      arrArrayFrom(data, 'payments').map(InvoicePayment.fromRaw),
      arrArrayFrom(data, 'events').map(InvoiceEvent.fromRaw),
      arrBool(data, 'cover_fee_required'),
      data['cover_fee_quote'] && typeof data['cover_fee_quote'] === 'object'
        ? CoverFeeQuote.fromRaw(data['cover_fee_quote'] as Raw)
        : undefined,
    )
  }
}
