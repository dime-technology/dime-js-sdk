import { arrString } from '../support/arr.js'

type Raw = Record<string, unknown>

export class FormLink {
  constructor(public readonly link?: string) {}

  static fromRaw(data: Raw): FormLink {
    return new FormLink(arrString(data, 'link'))
  }
}
