export {};

declare global {
  type ApiResponse<TDetails = any, TData = any> = {
    success: boolean;
    code: string;
    message: string;
    details?: TDetails;
    data?: TData;
  };

  interface DrizzleErrorCause extends Error {
    code: string;
    details?: string;
    constraint?: string;
  }
}
