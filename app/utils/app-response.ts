export function successResponse<T>({
  data,
  message,
}: {
  data?: T;
  message: string;
}): ApiResponse<T> {
  return {
    success: true,
    message: message || "Successful",
    data: data,
  };
}

export function errorResponse<E>({
  message,
  details,
}: {
  message: string;
  details?: E;
}): ApiResponse<E> {
  return {
    success: false,
    message: message,
    details: details,
  };
}
