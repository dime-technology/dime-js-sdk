import { arrInt, arrString } from '../support/arr.js'

type Raw = Record<string, unknown>

/** The subscription created by subscribing a customer, and its first charge. */
export class SubscribeResult {
  constructor(
    public readonly subscriptionId?: number,
    public readonly status?: string,
    public readonly nextRunDate?: string,
    public readonly transactionNumber?: string,
    public readonly amount?: string,
  ) {}

  static fromRaw(data: Raw): SubscribeResult {
    return new SubscribeResult(
      arrInt(data, 'subscription_id'),
      arrString(data, 'status'),
      arrString(data, 'next_run_date'),
      arrString(data, 'transaction_number'),
      arrString(data, 'amount'),
    )
  }
}
