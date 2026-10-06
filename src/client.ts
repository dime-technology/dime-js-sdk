import { Config, DEFAULT_BASE_URL } from './config.js'
import { Transport } from './http/transport.js'
import { Addresses } from './resources/addresses.js'
import { Chargebacks } from './resources/chargebacks.js'
import { Customers } from './resources/customers.js'
import { Deposits } from './resources/deposits.js'
import { Documents } from './resources/documents.js'
import { Funds } from './resources/funds.js'
import { Invoices } from './resources/invoices.js'
import { Merchants } from './resources/merchants.js'
import { PaymentMethods } from './resources/payment-methods.js'
import { RecurringInvoices } from './resources/recurring-invoices.js'
import { RecurringPayments } from './resources/recurring-payments.js'
import { SubscriptionPlans } from './resources/subscription-plans.js'
import { Subscriptions } from './resources/subscriptions.js'
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
  readonly invoices: Invoices
  readonly recurringInvoices: RecurringInvoices
  readonly chargebacks: Chargebacks
  readonly documents: Documents
  readonly funds: Funds
  readonly subscriptionPlans: SubscriptionPlans
  readonly subscriptions: Subscriptions

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
    this.invoices = new Invoices(transport)
    this.recurringInvoices = new RecurringInvoices(transport)
    this.chargebacks = new Chargebacks(transport)
    this.documents = new Documents(transport)
    this.funds = new Funds(transport)
    this.subscriptionPlans = new SubscriptionPlans(transport)
    this.subscriptions = new Subscriptions(transport)
  }

  config(): Config {
    return this._config
  }
}
