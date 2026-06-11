import { arrInt, arrString } from '../support/arr.js'

type Raw = Record<string, unknown>

export class RecurringPaymentMethod {
  constructor(
    public readonly id?: number,
    public readonly type?: string,
    public readonly lastFour?: string,
    public readonly expiration?: string,
    public readonly zip?: string,
    public readonly nameOnCard?: string,
    public readonly bankAccountName?: string,
    public readonly routingNumber?: string,
    public readonly accountNumber?: string,
    public readonly ownershipType?: string,
    public readonly accountType?: string,
    public readonly bankName?: string,
  ) {}

  static fromRaw(data: Raw): RecurringPaymentMethod {
    return new RecurringPaymentMethod(
      arrInt(data, 'id'),
      arrString(data, 'type'),
      arrString(data, 'last_four'),
      arrString(data, 'expiration'),
      arrString(data, 'zip'),
      arrString(data, 'name_on_card'),
      arrString(data, 'bank_account_name'),
      arrString(data, 'routing_number'),
      arrString(data, 'account_number'),
      arrString(data, 'ownership_type'),
      arrString(data, 'account_type'),
      arrString(data, 'bank_name'),
    )
  }
}
