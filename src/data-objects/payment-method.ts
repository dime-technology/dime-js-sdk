import { arrBool, arrInt, arrString } from '../support/arr.js'

type Raw = Record<string, unknown>

export class PaymentMethod {
  constructor(
    public readonly id?: number,
    public readonly type?: string,
    public readonly token?: string,
    public readonly firstName?: string,
    public readonly lastName?: string,
    public readonly ccNameOnCard?: string,
    public readonly ccLastFour?: string,
    public readonly ccExpirationDate?: string,
    public readonly ccBrand?: string,
    public readonly achBankAccountName?: string,
    public readonly achRoutingNumber?: string,
    public readonly achAccountNumber?: string,
    public readonly achOwnershipType?: string,
    public readonly achAccountType?: string,
    public readonly achBankName?: string,
    public readonly status?: string,
    public readonly statusDate?: string,
    public readonly enabled: boolean = false,
    public readonly isDefault: boolean = false,
    public readonly addr1?: string,
    public readonly addr2?: string,
    public readonly addr3?: string,
    public readonly city?: string,
    public readonly state?: string,
    public readonly zip?: string,
  ) {}

  static fromRaw(data: Raw): PaymentMethod {
    return new PaymentMethod(
      arrInt(data, 'id'),
      arrString(data, 'type'),
      arrString(data, 'token'),
      arrString(data, 'first_name'),
      arrString(data, 'last_name'),
      arrString(data, 'cc_name_on_card'),
      arrString(data, 'cc_last_four'),
      arrString(data, 'cc_expiration_date'),
      arrString(data, 'cc_brand'),
      arrString(data, 'ach_bank_account_name'),
      arrString(data, 'ach_routing_number'),
      arrString(data, 'ach_account_number'),
      arrString(data, 'ach_ownership_type'),
      arrString(data, 'ach_account_type'),
      arrString(data, 'ach_bank_name'),
      arrString(data, 'status'),
      arrString(data, 'status_date'),
      arrBool(data, 'enabled'),
      arrBool(data, 'default'),
      arrString(data, 'addr1'),
      arrString(data, 'addr2'),
      arrString(data, 'addr3'),
      arrString(data, 'city'),
      arrString(data, 'state'),
      arrString(data, 'zip'),
    )
  }
}
