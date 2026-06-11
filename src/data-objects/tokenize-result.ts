import { arrString } from '../support/arr.js'

type Raw = Record<string, unknown>

export class TokenizeResult {
  constructor(public readonly token?: string) {}

  static fromRaw(data: Raw): TokenizeResult {
    return new TokenizeResult(arrString(data, 'token'))
  }
}
