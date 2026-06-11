import { arrBool, arrObjectFrom, arrString } from '../support/arr.js'
import { TransactionAddress } from './transaction-address.js'

type Raw = Record<string, unknown>

export class Transaction {
  constructor(
    public readonly transactionType?: string,
    public readonly transactionStatus?: string,
    public readonly transactionStatusDescription?: string,
    public readonly transactionNumber?: string,
    public readonly transactionDate?: string,
    public readonly fundDate?: string,
    public readonly settleDate?: string,
    public readonly amount?: string,
    public readonly description?: string,
    public readonly statusCode?: string,
    public readonly statusText?: string,
    public readonly email?: string,
    public readonly phone?: string,
    public readonly customerUuid?: string,
    public readonly multiUseToken?: string,
    public readonly pending: boolean = false,
    public readonly transactionInfoId?: string,
    public readonly parentTransactionInfoId?: string,
    public readonly billingAddress: TransactionAddress = new TransactionAddress(),
    public readonly shippingAddress: TransactionAddress = new TransactionAddress(),
  ) {}

  static fromRaw(data: Raw): Transaction {
    return new Transaction(
      arrString(data, 'transaction_type'),
      arrString(data, 'transaction_status'),
      arrString(data, 'transaction_status_description'),
      arrString(data, 'transaction_number'),
      arrString(data, 'transaction_date'),
      arrString(data, 'fund_date'),
      arrString(data, 'settle_date'),
      arrString(data, 'amount'),
      arrString(data, 'description'),
      arrString(data, 'status_code'),
      arrString(data, 'status_text'),
      arrString(data, 'email'),
      arrString(data, 'phone'),
      arrString(data, 'customer_uuid'),
      arrString(data, 'multi_use_token'),
      arrBool(data, 'pending'),
      arrString(data, 'transaction_info_id'),
      arrString(data, 'parent_transaction_info_id'),
      TransactionAddress.fromRaw(arrObjectFrom(data, ['billing_address'])),
      // The API returns shipping under the camelCase key `shippingAddress`; accept
      // snake_case too in case that is ever corrected server-side.
      TransactionAddress.fromRaw(arrObjectFrom(data, ['shippingAddress', 'shipping_address'])),
    )
  }
}
