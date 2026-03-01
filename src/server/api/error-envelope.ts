/**
 * Shared API error and success envelope types per architecture.md
 */

export interface ErrorEnvelope {
  error: {
    code: string;
    message: string;
    details?: unknown[];
  };
  meta: {
    request_id: string;
    timestamp: string;
  };
}

export interface SuccessEnvelope<T> {
  data: T;
  meta: {
    request_id: string;
    timestamp: string;
  };
}

export function createErrorResponse(
  code: string,
  message: string,
  details?: unknown[],
  requestId?: string
): ErrorEnvelope {
  return {
    error: { code, message, details },
    meta: {
      request_id: requestId ?? crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    },
  };
}

export function createSuccessResponse<T>(
  data: T,
  requestId?: string
): SuccessEnvelope<T> {
  return {
    data,
    meta: {
      request_id: requestId ?? crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    },
  };
}
