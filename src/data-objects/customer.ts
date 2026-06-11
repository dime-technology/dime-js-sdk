import { arrString } from '../support/arr.js'

type Raw = Record<string, unknown>

export class Customer {
  constructor(
    public readonly uuid?: string,
    public readonly firstName?: string,
    public readonly lastName?: string,
    public readonly phone?: string,
    public readonly email?: string,
    public readonly addr1?: string,
    public readonly addr2?: string,
    public readonly addr3?: string,
    public readonly city?: string,
    public readonly state?: string,
    public readonly zip?: string,
    public readonly country?: string,
  ) {}

  static fromRaw(data: Raw): Customer {
    return new Customer(
      arrString(data, 'uuid'),
      arrString(data, 'first_name'),
      arrString(data, 'last_name'),
      arrString(data, 'phone'),
      arrString(data, 'email'),
      arrString(data, 'addr1'),
      arrString(data, 'addr2'),
      arrString(data, 'addr3'),
      arrString(data, 'city'),
      arrString(data, 'state'),
      arrString(data, 'zip'),
      arrString(data, 'country'),
    )
  }
}
