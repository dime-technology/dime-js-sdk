import {
  ApiException,
  AuthenticationException,
  NotFoundException,
  PermissionDeniedException,
  RateLimitException,
  ServerException,
  ValidationException,
} from '../exceptions/index.js'

type Raw = Record<string, unknown>

function looksLikeValidation(status: number, body: Raw): boolean {
  if (
    body['errors'] !== undefined &&
    typeof body['errors'] === 'object' &&
    !Array.isArray(body['errors'])
  ) {
    return true
  }
  return (
    (status === 400 || status === 422) &&
    body['message'] !== undefined &&
    typeof body['message'] === 'object' &&
    !Array.isArray(body['message'])
  )
}

function extractErrors(body: Raw): Record<string, string[]> {
  const raw = body['errors'] ?? body['message']
  if (raw === null || raw === undefined || typeof raw !== 'object' || Array.isArray(raw)) {
    return {}
  }

  const errors: Record<string, string[]> = {}
  for (const [field, messages] of Object.entries(raw as Record<string, unknown>)) {
    errors[field] = Array.isArray(messages) ? messages.map(String) : [String(messages)]
  }
  return errors
}

function extractMessage(body: Raw): string | undefined {
  const data = body['data']
  if (data !== null && data !== undefined && typeof data === 'object' && !Array.isArray(data)) {
    const msg = (data as Raw)['message']
    if (typeof msg === 'string') return msg
  }
  if (typeof body['message'] === 'string') return body['message']
  return undefined
}

function firstMessage(errors: Record<string, string[]>): string | undefined {
  for (const messages of Object.values(errors)) {
    if (messages.length > 0) return messages[0]
  }
  return undefined
}

export function handleError(status: number, body: Raw, retryAfter?: number): never {
  if (looksLikeValidation(status, body)) {
    const errors = extractErrors(body)
    throw new ValidationException(
      firstMessage(errors) ?? 'The given data was invalid.',
      errors,
      status,
      body,
    )
  }

  const message = extractMessage(body) ?? `Dime API request failed with status ${status}.`

  if (status === 401) throw new AuthenticationException(message, status, body)
  if (status === 403) throw new PermissionDeniedException(message, status, body)
  if (status === 404) throw new NotFoundException(message, status, body)
  if (status === 429) throw new RateLimitException(message, retryAfter, status, body)
  if (status >= 500) throw new ServerException(message, status, body)
  throw new ApiException(message, status, body)
}
