import { arrBool, arrString } from '../support/arr.js'

type Raw = Record<string, unknown>

export class Merchant {
  constructor(
    public readonly name?: string,
    public readonly sid?: string,
    public readonly mcc?: string,
    public readonly slug?: string,
    public readonly pubApiKey?: string,
    public readonly processorMid?: string,
    public readonly active: boolean = false,
    public readonly activeAt?: string,
    public readonly gPay: boolean = false,
    public readonly aPay: boolean = false,
    public readonly pciCompliance: boolean = false,
    public readonly website?: string,
    public readonly addr1?: string,
    public readonly addr2?: string,
    public readonly city?: string,
    public readonly state?: string,
    public readonly zip?: string,
    public readonly phone?: string,
    public readonly primaryPhone?: string,
    public readonly primaryEmail?: string,
    public readonly primaryName?: string,
  ) {}

  static fromRaw(data: Raw): Merchant {
    return new Merchant(
      arrString(data, 'name'),
      arrString(data, 'sid'),
      arrString(data, 'mcc'),
      arrString(data, 'slug'),
      arrString(data, 'pub_api_key'),
      arrString(data, 'processor_mid'),
      arrBool(data, 'active'),
      arrString(data, 'active_at'),
      arrBool(data, 'g_pay'),
      arrBool(data, 'a_pay'),
      arrBool(data, 'pci_compliance'),
      arrString(data, 'website'),
      arrString(data, 'addr1'),
      arrString(data, 'addr2'),
      arrString(data, 'city'),
      arrString(data, 'state'),
      arrString(data, 'zip'),
      arrString(data, 'phone'),
      arrString(data, 'primary_phone'),
      arrString(data, 'primary_email'),
      arrString(data, 'primary_name'),
    )
  }
}
