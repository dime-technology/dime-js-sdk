import { RecurringInvoice } from '../data-objects/recurring-invoice.js'
import { CursorPage } from '../pagination/cursor-page.js'
import { AbstractResource } from './abstract-resource.js'

type Raw = Record<string, unknown>

/**
 * Recurring-invoice templates, which generate and send an invoice on a schedule.
 *
 * Identify the customer with `customer_uuid`; `customer_id` remains accepted.
 */
export class RecurringInvoices extends AbstractResource {
  /**
   * List recurring-invoice templates.
   *
   * @param filters `status` — Active | Paused | Cancelled | Completed
   */
  async list(sid: string, filters: Raw = {}): Promise<CursorPage<RecurringInvoice>> {
    return this.paginate(
      'GET',
      'recurring-invoices',
      this.envelope({ sid }, filters),
      RecurringInvoice.fromRaw,
    )
  }

  async show(sid: string, recurringInvoiceId: number | string): Promise<RecurringInvoice> {
    const raw = await this.transport.request(
      'GET',
      'recurring-invoice',
      this.envelope({ sid, recurring_invoice_id: recurringInvoiceId }),
    )
    return RecurringInvoice.fromRaw((raw['data'] as Raw) ?? {})
  }

  /**
   * Create a recurring-invoice template. When `recurring_start_date` is today the
   * first invoice is generated and sent immediately.
   *
   * @param attributes
   *   `customer_uuid` (or `customer_id`), `payment_terms` (`due_on_receipt` |
   *   `net_15` | `net_30` | `net_60`), `recurring_frequency` (`Weekly` |
   *   `Biweekly` | `FirstFifteenth` | `Monthly` | `Yearly`),
   *   `recurring_start_date` (Y-m-d) and `lines` are required. Optional:
   *   `recurring_end_date` (Y-m-d, on or after the start date),
   *   `thank_you_note`.
   *
   *   `cover_fee_required` makes the customer cover the processing fee on every
   *   invoice this template generates.
   */
  async create(sid: string, attributes: Raw): Promise<RecurringInvoice> {
    const raw = await this.transport.request(
      'POST',
      'recurring-invoice/create',
      this.envelope({ sid, ...attributes }),
    )
    return RecurringInvoice.fromRaw((raw['data'] as Raw) ?? {})
  }

  async cancel(sid: string, recurringInvoiceId: number | string): Promise<RecurringInvoice> {
    const raw = await this.transport.request(
      'POST',
      'recurring-invoice/cancel',
      this.envelope({ sid, recurring_invoice_id: recurringInvoiceId }),
    )
    return RecurringInvoice.fromRaw((raw['data'] as Raw) ?? {})
  }
}
