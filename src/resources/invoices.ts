import { Invoice } from '../data-objects/invoice.js'
import { InvoiceItem } from '../data-objects/invoice-item.js'
import { InvoiceLink } from '../data-objects/invoice-link.js'
import { MessageResult } from '../data-objects/message-result.js'
import { CursorPage } from '../pagination/cursor-page.js'
import { AbstractResource } from './abstract-resource.js'

type Raw = Record<string, unknown>

/**
 * Invoice endpoints.
 *
 * Identify the customer with `customer_uuid` — the same identifier the customer,
 * payment-method and address endpoints use, and the only one `Customer` exposes.
 * `customer_id` remains accepted for integrations written against the original
 * contract; supply exactly one.
 *
 * Line-item mutations return the refreshed invoice so the caller sees
 * recalculated totals rather than a detached fragment.
 */
export class Invoices extends AbstractResource {
  /**
   * List invoices for a merchant.
   *
   * @param filters `status` — draft | sent | paid | partial | void | overdue
   */
  async list(sid: string, filters: Raw = {}): Promise<CursorPage<Invoice>> {
    return this.paginate('GET', 'invoices', this.envelope({ sid }, filters), Invoice.fromRaw)
  }

  async show(sid: string, invoiceId: number | string): Promise<Invoice> {
    const raw = await this.transport.request(
      'GET',
      'invoice',
      this.envelope({ sid, invoice_id: invoiceId }),
    )
    return Invoice.fromRaw((raw['data'] as Raw) ?? {})
  }

  /**
   * Create a draft invoice with its line items. Every line must reference a
   * Merchant `item_id`; the line name and unit price are snapshotted.
   *
   * @param attributes
   *   `customer_uuid` (or `customer_id`), `customer_name`, `customer_email`,
   *   `payment_terms` (`due_on_receipt` | `net_15` | `net_30` | `net_60`) and
   *   `lines` are required. `lines[]` takes `item_id`, `name`, `quantity`,
   *   `unit_price` and optional `description`. Optional: `invoice_number`,
   *   `issue_date` (Y-m-d, defaults to today — `due_date` is derived from
   *   `payment_terms`), `thank_you_note`, `allow_partial_payment`,
   *   `cover_fee_required`, `reminder_settings`.
   *
   *   Set `cover_fee_required` to make the customer pay the processing fee. The
   *   fee is added on top of the invoice at payment time rather than becoming a
   *   line item, so `total` stays the amount owed to the merchant — read
   *   `invoice.coverFeeQuote` for what the customer will actually be charged.
   *   Omitting the field inherits the merchant's invoice setting.
   */
  async create(sid: string, attributes: Raw): Promise<Invoice> {
    const raw = await this.transport.request(
      'POST',
      'invoice/create',
      this.envelope({ sid, ...attributes }),
    )
    return Invoice.fromRaw((raw['data'] as Raw) ?? {})
  }

  /**
   * Update a draft invoice. Only drafts can be edited, and passing `lines`
   * replaces the existing line items.
   *
   * @param attributes same shape as {@link Invoices.create}
   */
  async update(sid: string, invoiceId: number | string, attributes: Raw): Promise<Invoice> {
    const raw = await this.transport.request(
      'PATCH',
      'invoice/update',
      this.envelope({ sid, invoice_id: invoiceId, ...attributes }),
    )
    return Invoice.fromRaw((raw['data'] as Raw) ?? {})
  }

  async delete(sid: string, invoiceId: number | string): Promise<MessageResult> {
    const raw = await this.transport.request(
      'POST',
      'invoice/delete',
      this.envelope({ sid, invoice_id: invoiceId }),
    )
    return MessageResult.fromRaw((raw['data'] as Raw) ?? raw)
  }

  /** Email the invoice to the customer and advance it to Sent. */
  async send(sid: string, invoiceId: number | string): Promise<Invoice> {
    const raw = await this.transport.request(
      'POST',
      'invoice/send',
      this.envelope({ sid, invoice_id: invoiceId }),
    )
    return Invoice.fromRaw((raw['data'] as Raw) ?? {})
  }

  /** Activate a draft invoice for payment without emailing it. */
  async markSent(sid: string, invoiceId: number | string): Promise<Invoice> {
    const raw = await this.transport.request(
      'POST',
      'invoice/mark-sent',
      this.envelope({ sid, invoice_id: invoiceId }),
    )
    return Invoice.fromRaw((raw['data'] as Raw) ?? {})
  }

  async void(sid: string, invoiceId: number | string): Promise<Invoice> {
    const raw = await this.transport.request(
      'PATCH',
      'invoice/void',
      this.envelope({ sid, invoice_id: invoiceId }),
    )
    return Invoice.fromRaw((raw['data'] as Raw) ?? {})
  }

  /** Clone any invoice into a new draft with a freshly allocated number. */
  async duplicate(sid: string, invoiceId: number | string): Promise<Invoice> {
    const raw = await this.transport.request(
      'POST',
      'invoice/duplicate',
      this.envelope({ sid, invoice_id: invoiceId }),
    )
    return Invoice.fromRaw((raw['data'] as Raw) ?? {})
  }

  /**
   * Record a merchant-initiated (MOTO) card or ACH payment against an open
   * invoice.
   *
   * @param attributes
   *   `payment_type` is required and is `cc` or `ach`. For a card, pass a stored
   *   `token` or raw `cardholder_name` / `card_number` / `expiration_date` (m/Y)
   *   plus optional `cvv`; for ACH, pass `routing_number` / `account_number` /
   *   `account_type` (Checking | Savings) / `account_name`. Omit `amount` to pay
   *   the full balance — partial amounts require the invoice to allow them.
   *   Optional: `memo`, `billing_address`.
   *
   *   On a cover-fee invoice the processing fee for `payment_type` is charged on
   *   top of `amount`, so the card or bank account is debited more than the
   *   invoice is credited. The fee lands as `coverFee` on the matching entry in
   *   `invoice.payments`. Card and ACH rates differ, so the same `amount` settles
   *   differently per `payment_type`.
   */
  async pay(sid: string, invoiceId: number | string, attributes: Raw): Promise<Invoice> {
    const raw = await this.transport.request(
      'POST',
      'invoice/pay',
      this.envelope({ sid, invoice_id: invoiceId, ...attributes }),
    )
    return Invoice.fromRaw((raw['data'] as Raw) ?? {})
  }

  /** Get the public pay link (and token) for an invoice. */
  async getLink(sid: string, invoiceId: number | string): Promise<InvoiceLink> {
    const raw = await this.transport.request(
      'GET',
      'invoice/link',
      this.envelope({ sid, invoice_id: invoiceId }),
    )
    return InvoiceLink.fromRaw((raw['data'] as Raw) ?? {})
  }

  /**
   * Append a single line item to a draft invoice.
   *
   * @param attributes `item_id`, `name`, `quantity` and `unit_price` are
   *   required; `description` is optional.
   */
  async addLineItem(sid: string, invoiceId: number | string, attributes: Raw): Promise<Invoice> {
    const raw = await this.transport.request(
      'POST',
      'invoice/line-item/add',
      this.envelope({ sid, invoice_id: invoiceId, ...attributes }),
    )
    return Invoice.fromRaw((raw['data'] as Raw) ?? {})
  }

  /**
   * Update a single line item on a draft invoice.
   *
   * @param attributes any of `item_id`, `name`, `description`, `quantity`,
   *   `unit_price`
   */
  async updateLineItem(
    sid: string,
    invoiceId: number | string,
    lineItemId: number | string,
    attributes: Raw,
  ): Promise<Invoice> {
    const raw = await this.transport.request(
      'PATCH',
      'invoice/line-item/update',
      this.envelope({ sid, invoice_id: invoiceId, line_item_id: lineItemId, ...attributes }),
    )
    return Invoice.fromRaw((raw['data'] as Raw) ?? {})
  }

  /** Remove a single line item from a draft invoice. */
  async deleteLineItem(
    sid: string,
    invoiceId: number | string,
    lineItemId: number | string,
  ): Promise<Invoice> {
    const raw = await this.transport.request(
      'POST',
      'invoice/line-item/delete',
      this.envelope({ sid, invoice_id: invoiceId, line_item_id: lineItemId }),
    )
    return Invoice.fromRaw((raw['data'] as Raw) ?? {})
  }

  /** List the Merchant's items (funds/designations) available as invoice line items. */
  async listItems(sid: string): Promise<InvoiceItem[]> {
    const raw = await this.transport.request('GET', 'invoice/items', this.envelope({ sid }))
    const items = Array.isArray(raw['data']) ? (raw['data'] as Raw[]) : []
    return items.map(InvoiceItem.fromRaw)
  }

  /**
   * Create an invoicing-only item (fund/designation) for the Merchant. The item
   * is hidden from public giving pages and can be referenced as a line's
   * `item_id`.
   *
   * @param attributes `name` is required; `description`, `price` and
   *   `tax_deductible` are optional.
   */
  async createItem(sid: string, attributes: Raw): Promise<InvoiceItem> {
    const raw = await this.transport.request(
      'POST',
      'invoice/item/create',
      this.envelope({ sid, ...attributes }),
    )
    return InvoiceItem.fromRaw((raw['data'] as Raw) ?? {})
  }
}
