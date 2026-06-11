import { arrInt, arrObjectFrom, arrString } from '../support/arr.js'
import { RecurringPaymentMethod } from './recurring-payment-method.js'
import { TransactionAddress } from './transaction-address.js'

type Raw = Record<string, unknown>

export class RecurringPayment {
  constructor(
    public readonly id?: number,
    public readonly name?: string,
    public readonly amount?: string,
    public readonly startDate?: string,
    public readonly endDate?: string,
    public readonly recurrenceSchedule?: string,
    public readonly lastRunDate?: string,
    public readonly lastRunStatus?: string,
    public readonly lastRunFailedCount?: number,
    public readonly nextRunDate?: string,
    public readonly status?: string,
    public readonly pausedUntilDate?: string,
    public readonly customerUuid?: string,
    public readonly cancelledAt?: string,
    public readonly error?: string,
    public readonly paymentMethod: RecurringPaymentMethod = new RecurringPaymentMethod(),
    public readonly shippingAddress: TransactionAddress = new TransactionAddress(),
  ) {}

  static fromRaw(data: Raw): RecurringPayment {
    return new RecurringPayment(
      arrInt(data, 'id'),
      arrString(data, 'name'),
      arrString(data, 'amount'),
      arrString(data, 'start_date'),
      arrString(data, 'end_date'),
      arrString(data, 'recurrence_schedule'),
      arrString(data, 'last_run_date'),
      arrString(data, 'last_run_status'),
      arrInt(data, 'last_run_failed_count'),
      arrString(data, 'next_run_date'),
      arrString(data, 'status'),
      arrString(data, 'paused_until_date'),
      arrString(data, 'customer_uuid'),
      arrString(data, 'cancelled_at'),
      arrString(data, 'error'),
      RecurringPaymentMethod.fromRaw(arrObjectFrom(data, ['payment_method'])),
      TransactionAddress.fromRaw(arrObjectFrom(data, ['shipping_address'])),
    )
  }
}
