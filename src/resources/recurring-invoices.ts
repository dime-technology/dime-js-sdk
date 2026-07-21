import { RecurringInvoice } from '../data-objects/recurring-invoice.js'
import { CursorPage } from '../pagination/cursor-page.js'
import { AbstractResource } from './abstract-resource.js'

type Raw = Record<string, unknown>

export class RecurringInvoices extends AbstractResource {
  async list(sid: string, filters: Raw = {}): Promise<CursorPage<RecurringInvoice>> {
    return this.paginate('GET', 'recurring-invoices', this.envelope({ sid }, filters), RecurringInvoice.fromRaw)
  }

  async show(sid: string, recurringInvoiceId: number | string): Promise<RecurringInvoice> {
    const raw = await this.transport.request('GET', 'recurring-invoice', this.envelope({ sid, recurring_invoice_id: recurringInvoiceId }))
    return RecurringInvoice.fromRaw((raw['data'] as Raw) ?? {})
  }

  async create(sid: string, attributes: Raw): Promise<RecurringInvoice> {
    const raw = await this.transport.request('POST', 'recurring-invoice/create', this.envelope({ sid, ...attributes }))
    return RecurringInvoice.fromRaw((raw['data'] as Raw) ?? {})
  }

  async cancel(sid: string, recurringInvoiceId: number | string): Promise<RecurringInvoice> {
    const raw = await this.transport.request('POST', 'recurring-invoice/cancel', this.envelope({ sid, recurring_invoice_id: recurringInvoiceId }))
    return RecurringInvoice.fromRaw((raw['data'] as Raw) ?? {})
  }
}
