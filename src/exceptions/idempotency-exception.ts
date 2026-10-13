import { ApiException } from './api-exception.js'

/**
 * The API refused an `Idempotency-Key`: it was already used for a different
 * request (422), or the request that first used it is still running or never
 * finished (409).
 */
export class IdempotencyException extends ApiException {}
