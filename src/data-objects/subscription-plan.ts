import { arrArrayFrom, arrBool, arrInt, arrString } from '../support/arr.js'
import { SubscriptionItem } from './subscription-item.js'

type Raw = Record<string, unknown>

/**
 * A subscription plan. `status` is `draft`, `active` or `archived`; only an
 * active plan takes new subscribers. `publicUrl` is the plan's hosted
 * subscribe page.
 */
export class SubscriptionPlan {
  constructor(
    public readonly id?: number,
    public readonly name?: string,
    public readonly description?: string,
    public readonly recurrenceSchedule?: string,
    public readonly status?: string,
    public readonly subtotal?: string,
    public readonly total?: string,
    public readonly token?: string,
    public readonly publicUrl?: string,
    public readonly allowPublic: boolean = false,
    public readonly createdAt?: string,
    public readonly items: SubscriptionItem[] = [],
  ) {}

  static fromRaw(data: Raw): SubscriptionPlan {
    return new SubscriptionPlan(
      arrInt(data, 'id'),
      arrString(data, 'name'),
      arrString(data, 'description'),
      arrString(data, 'recurrence_schedule'),
      arrString(data, 'status'),
      arrString(data, 'subtotal'),
      arrString(data, 'total'),
      arrString(data, 'token'),
      arrString(data, 'public_url'),
      arrBool(data, 'allow_public'),
      arrString(data, 'created_at'),
      arrArrayFrom(data, 'items').map(SubscriptionItem.fromRaw),
    )
  }
}
