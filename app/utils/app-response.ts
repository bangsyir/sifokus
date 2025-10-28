export function successResponse<T>({
  code,
  data,
  message,
}: {
  code: string;
  data?: T;
  message: string;
}): ApiResponse<T> {
  return {
    success: true,
    code: code,
    message: message || "Successful",
    data: data,
  };
}

export function errorResponse<E>({
  code,
  message,
  details,
}: {
  code: string;
  message: string;
  details?: E;
}): ApiResponse<undefined, E> {
  return {
    success: false,
    code: code,
    message: message,
    details: details,
  };
}
