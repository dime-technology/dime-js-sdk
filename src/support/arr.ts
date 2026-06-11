type Raw = Record<string, unknown>

export function arrString(data: Raw, key: string): string | undefined {
  const value = data[key]
  if (value === null || value === undefined || Array.isArray(value)) return undefined
  if (typeof value === 'boolean') return value ? '1' : '0'
  return String(value)
}

export function arrStringFrom(data: Raw, keys: string[]): string | undefined {
  for (const key of keys) {
    if (key in data && data[key] !== null && data[key] !== undefined) {
      return arrString(data, key)
    }
  }
  return undefined
}

export function arrInt(data: Raw, key: string): number | undefined {
  const value = data[key]
  if (value === null || value === undefined) return undefined
  const n = Number(value)
  return Number.isNaN(n) ? undefined : Math.trunc(n)
}

export function arrBool(data: Raw, key: string, defaultValue = false): boolean {
  const value = data[key]
  return value === null || value === undefined ? defaultValue : Boolean(value)
}

export function arrObjectFrom(data: Raw, keys: string[]): Raw {
  for (const key of keys) {
    const value = data[key]
    if (
      value !== null &&
      value !== undefined &&
      typeof value === 'object' &&
      !Array.isArray(value)
    ) {
      return value as Raw
    }
  }
  return {}
}

export function arrArrayFrom(data: Raw, key: string): Raw[] {
  const value = data[key]
  if (Array.isArray(value)) return value as Raw[]
  return []
}
