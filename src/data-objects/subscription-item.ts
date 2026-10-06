import { arrString } from '../support/arr.js'

type Raw = Record<string, unknown>

/**
 * A line item on a subscription plan, or the snapshot a subscription took of
 * it when the customer subscribed. `amount` is present on subscriptions only.
 */
export class SubscriptionItem {
  constructor(
    public readonly name?: string,
    public readonly description?: string,
    public readonly quantity?: string,
    public readonly unitPrice?: string,
    public readonly amount?: string,
  ) {}

  static fromRaw(data: Raw): SubscriptionItem {
    return new SubscriptionItem(
      arrString(data, 'name'),
      arrString(data, 'description'),
      arrString(data, 'quantity'),
      arrString(data, 'unit_price'),
      arrString(data, 'amount'),
    )
  }
}
