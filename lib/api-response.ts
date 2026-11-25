import { NextResponse } from "next/server";

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function apiError(
  code: string,
  message: string,
  details: any = null,
  status = 400
) {
  return NextResponse.json(
    {
      error: {
        code,
        message,
        details,
      },
    },
    { status }
  );
}

export function apiUnauthorized(message = "Authentication required") {
  return apiError("UNAUTHORIZED", message, null, 401);
}

export function apiForbidden(message = "Access denied: Insufficient role permissions") {
  return apiError("FORBIDDEN", message, null, 403);
}

export function apiNotFound(entity = "Resource") {
  return apiError("NOT_FOUND", `${entity} not found.`, null, 404);
}

export function apiConflict(message: string, details: any = null) {
  return apiError("CONFLICT", message, details, 409);
}

