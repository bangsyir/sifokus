export {};

declare global {
  type ApiResponse<T = undefined, E = undefined> = {
    success: boolean;
    code: string;
    message: string;
    details?: E;
    data?: T;
  };
  interface DrizzleErrorCause extends Error {
    code: string;
    details?: string;
    constraint?: string;
  }
}
