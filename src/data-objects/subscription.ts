import { arrArrayFrom, arrInt, arrObjectFrom, arrString } from '../support/arr.js'
import { RecurringPaymentMethod } from './recurring-payment-method.js'
import { SubscriptionItem } from './subscription-item.js'

type Raw = Record<string, unknown>

/**
 * A customer's subscription to a plan. `status` is `Active`, `Failed`,
 * `Paused`, `Cancelled` or `Ended`.
 */
export class Subscription {
  constructor(
    public readonly id?: number,
    public readonly subscriptionPlanId?: number,
    public readonly planName?: string,
    public readonly amount?: string,
    public readonly recurrenceSchedule?: string,
    public readonly startDate?: string,
    public readonly endDate?: string,
    public readonly lastRunDate?: string,
    public readonly lastRunStatus?: string,
    public readonly lastRunFailedCount?: number,
    public readonly nextRunDate?: string,
    public readonly status?: string,
    public readonly pausedUntilDate?: string,
    public readonly cancelledAt?: string,
    public readonly cancelledBy?: string,
    public readonly customerUuid?: string,
    public readonly error?: string,
    public readonly paymentMethod: RecurringPaymentMethod = new RecurringPaymentMethod(),
    // The line items snapshotted at subscribe time — present on `show` only.
    public readonly items: SubscriptionItem[] = [],
  ) {}

  static fromRaw(data: Raw): Subscription {
    return new Subscription(
      arrInt(data, 'id'),
      arrInt(data, 'subscription_plan_id'),
      arrString(data, 'plan_name'),
      arrString(data, 'amount'),
      arrString(data, 'recurrence_schedule'),
      arrString(data, 'start_date'),
      arrString(data, 'end_date'),
      arrString(data, 'last_run_date'),
      arrString(data, 'last_run_status'),
      arrInt(data, 'last_run_failed_count'),
      arrString(data, 'next_run_date'),
      arrString(data, 'status'),
      arrString(data, 'paused_until_date'),
      arrString(data, 'cancelled_at'),
      arrString(data, 'cancelled_by'),
      arrString(data, 'customer_uuid'),
      arrString(data, 'error'),
      RecurringPaymentMethod.fromRaw(arrObjectFrom(data, ['payment_method'])),
      arrArrayFrom(data, 'items').map(SubscriptionItem.fromRaw),
    )
  }
}
