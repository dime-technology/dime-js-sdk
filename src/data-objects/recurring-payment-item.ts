import { arrInt, arrString } from '../support/arr.js'

type Raw = Record<string, unknown>

/**
 * The item (designation) a recurring payment is pinned to, which each run is
 * credited to. `name` can be absent while `id` is set, when the API does not
 * disclose the item's name.
 */
export class RecurringPaymentItem {
  constructor(
    public readonly id?: number,
    public readonly name?: string,
  ) {}

  static fromRaw(data: Raw): RecurringPaymentItem {
    return new RecurringPaymentItem(arrInt(data, 'id'), arrString(data, 'name'))
  }
}
