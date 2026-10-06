import { arrBool, arrInt, arrString } from '../support/arr.js'

type Raw = Record<string, unknown>

/**
 * A chargeback raised against a merchant, as of the processor's most recent
 * daily file. The same shape the `chargeback_*` webhooks carry.
 *
 * `transactionInfoId` identifies the chargeback itself; the disputed payment is
 * `parentTransactionInfoId`. Amounts are kept as strings to avoid float rounding.
 */
export class Chargeback {
  constructor(
    public readonly transactionInfoId?: string,
    public readonly parentTransactionInfoId?: string,
    public readonly gatewayTransactionId?: string,
    public readonly transactionNumber?: string,
    public readonly invoiceNumber?: string,
    public readonly chargebackDate?: string,
    public readonly merchantChargebackDate?: string,
    public readonly transactionAmount?: string,
    public readonly chargebackAmount?: string,
    public readonly cardBrand?: string,
    public readonly ccLastFour?: string,
    public readonly payeeName?: string,
    public readonly daysToRepresent?: number,
    public readonly representmentDate?: string,
    public readonly merchantRepresentmentDate?: string,
    public readonly representmentStatus?: string,
    public readonly result?: string,
    public readonly chargebackCode?: string,
    public readonly chargebackResponseCode?: string,
    public readonly resolved: boolean = false,
  ) {}

  static fromRaw(data: Raw): Chargeback {
    return new Chargeback(
      arrString(data, 'transaction_info_id'),
      arrString(data, 'parent_transaction_info_id'),
      arrString(data, 'gateway_transaction_id'),
      arrString(data, 'transaction_number'),
      arrString(data, 'invoice_number'),
      arrString(data, 'chargeback_date'),
      arrString(data, 'merchant_chargeback_date'),
      arrString(data, 'transaction_amount'),
      arrString(data, 'chargeback_amount'),
      arrString(data, 'card_brand'),
      arrString(data, 'cc_last_four'),
      arrString(data, 'payee_name'),
      arrInt(data, 'days_to_represent'),
      arrString(data, 'representment_date'),
      arrString(data, 'merchant_representment_date'),
      arrString(data, 'representment_status'),
      arrString(data, 'result'),
      arrString(data, 'chargeback_code'),
      arrString(data, 'chargeback_response_code'),
      arrBool(data, 'resolved'),
    )
  }
}
