import { arrObjectFrom, arrString } from '../support/arr.js'

type Raw = Record<string, unknown>

/**
 * The processing fee a cover-fee invoice adds on top of what the customer pays,
 * quoted for both payment methods.
 *
 * Present on an {@link Invoice} only when `coverFeeRequired` is true. The fee is
 * NOT a line item and is NOT part of the invoice's `total`: the merchant is owed
 * `total`, and the customer is charged `total` plus this fee. Card and ACH rates
 * differ, so the amount depends on how the customer chooses to pay — `ccTotal` is
 * the higher of the two and what the invoice and its emails lead with.
 *
 * `basis` names what the quote was computed against — currently always `balance`,
 * the amount still outstanding. Paying a partial amount re-quotes the fee against
 * that amount, so treat these as a quote for settling in full today rather than a
 * fixed charge.
 *
 * Monetary values are kept as strings to avoid float rounding.
 */
export class CoverFeeQuote {
  constructor(
    public readonly basis?: string,
    public readonly base?: string,
    public readonly ccFee?: string,
    public readonly ccTotal?: string,
    public readonly achFee?: string,
    public readonly achTotal?: string,
  ) {}

  static fromRaw(data: Raw): CoverFeeQuote {
    const cc = arrObjectFrom(data, ['cc'])
    const ach = arrObjectFrom(data, ['ach'])

    return new CoverFeeQuote(
      arrString(data, 'basis'),
      arrString(data, 'base'),
      arrString(cc, 'fee'),
      arrString(cc, 'total'),
      arrString(ach, 'fee'),
      arrString(ach, 'total'),
    )
  }
}
