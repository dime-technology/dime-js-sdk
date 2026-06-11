import { arrInt, arrString } from '../support/arr.js'

type Raw = Record<string, unknown>

export class Address {
  constructor(
    public readonly id?: number,
    public readonly recipient?: string,
    public readonly lineOne?: string,
    public readonly lineTwo?: string,
    public readonly lineThree?: string,
    public readonly city?: string,
    public readonly state?: string,
    public readonly zip?: string,
  ) {}

  static fromRaw(data: Raw): Address {
    return new Address(
      // show returns address_id; list returns id
      arrInt(data, 'address_id') ?? arrInt(data, 'id'),
      arrString(data, 'recipient'),
      arrString(data, 'line_one'),
      arrString(data, 'line_two'),
      arrString(data, 'line_three'),
      arrString(data, 'city'),
      arrString(data, 'state'),
      arrString(data, 'zip'),
    )
  }
}
