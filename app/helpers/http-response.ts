export const HttpStatusCodes = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  TO_MANY_REQUEST: 429,
  INTERNAL_SERVER_ERROR: 500,
};
const HttpStatus = {
  OK: "OK",
  CREATED: "CREATED",
  NO_CONTENT: "NO_CONTENT",
  BAD_REQUEST: "BAD_REQUEST",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",
  TO_MANY_REQUEST: "TO_MANY_REQUEST",
  INTERNAL_SERVER_ERROR: "INTERNAL_SERVER_ERROR",
};

export function uniqueViolationErr(field: string, message: string) {
  return { [field]: [message] };
}
export const appResponse = {
  OK: <TData = any>(
    message: string,
    data?: TData,
  ): ApiResponse<null, TData> => {
    return { success: true, code: HttpStatus.OK, message, data };
  },
  Created: <TData = any>(
    message: string = "Resource created successfully.",
    data?: TData,
  ): ApiResponse<null, TData> => {
    return { success: true, code: HttpStatus.CREATED, message, data };
  },
  NoContent: (
    message: string = "No content to return.",
  ): ApiResponse<null, null> => {
    return { success: true, code: HttpStatus.NO_CONTENT, message, data: null };
  },
  BadRequest: <TDetails = any>(
    message: string,
    details?: TDetails,
  ): ApiResponse<TDetails, null> => {
    return { success: false, code: HttpStatus.BAD_REQUEST, message, details };
  },
  Unauthorized: (message: string = "Unauthorized"): ApiResponse<null, null> => {
    return { success: false, code: HttpStatus.UNAUTHORIZED, message };
  },

  Forbidden: (message: string = "Forbidden"): ApiResponse<null, null> => {
    return { success: false, code: HttpStatus.FORBIDDEN, message };
  },

  NotFound: (message: string = "Not Found"): ApiResponse<null, null> => {
    return { success: false, code: HttpStatus.NOT_FOUND, message };
  },
  Conflict: <TDetails = any>(
    message: string,
    details?: TDetails,
  ): ApiResponse<TDetails, null> => {
    return { success: false, code: HttpStatus.CONFLICT, message, details };
  },
  ToManyRequest: (message: string): ApiResponse<null, null> => {
    return { success: false, code: HttpStatus.TO_MANY_REQUEST, message };
  },
  InternalServerError: (
    message: string = "Internal Server Error",
  ): ApiResponse<null, null> => {
    return { success: false, code: HttpStatus.INTERNAL_SERVER_ERROR, message };
  },
};
