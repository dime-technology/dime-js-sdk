import { Config, DEFAULT_BASE_URL } from './config.js'
import { Transport } from './http/transport.js'
import { Addresses } from './resources/addresses.js'
import { Customers } from './resources/customers.js'
import { Deposits } from './resources/deposits.js'
import { Merchants } from './resources/merchants.js'
import { PaymentMethods } from './resources/payment-methods.js'
import { RecurringPayments } from './resources/recurring-payments.js'
import { Transactions } from './resources/transactions.js'

/**
 * Entry point for the Dime Payments API.
 *
 * ```ts
 * const dime = new Client('your-api-token')
 * const txn = await dime.transactions.chargeCard('000010', {
 *   amount: '49.99',
 *   token: 'tok_abc123',
 * })
 * ```
 */
export class Client {
  readonly transactions: Transactions
  readonly customers: Customers
  readonly paymentMethods: PaymentMethods
  readonly merchants: Merchants
  readonly addresses: Addresses
  readonly deposits: Deposits
  readonly recurringPayments: RecurringPayments

  private readonly _config: Config

  constructor(token: string | Config, baseUrl: string = DEFAULT_BASE_URL) {
    this._config = token instanceof Config ? token : new Config(token, baseUrl)

    const transport = new Transport(this._config)

    this.transactions = new Transactions(transport)
    this.customers = new Customers(transport)
    this.paymentMethods = new PaymentMethods(transport)
    this.merchants = new Merchants(transport)
    this.addresses = new Addresses(transport)
    this.deposits = new Deposits(transport)
    this.recurringPayments = new RecurringPayments(transport)
  }

  config(): Config {
    return this._config
  }
}
