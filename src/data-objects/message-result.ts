import { arrString } from '../support/arr.js'

type Raw = Record<string, unknown>

export class MessageResult {
  constructor(public readonly message?: string) {}

  static fromRaw(data: Raw): MessageResult {
    return new MessageResult(arrString(data, 'message'))
  }
}
