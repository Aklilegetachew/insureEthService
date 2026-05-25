type SuccessResponseOptions<T> = {
  message: string;
  data?: T;
};

type ErrorResponseOptions = {
  message: string;
  errors?: unknown;
};

export class ApiResponse {
  static success<T>({ message, data }: SuccessResponseOptions<T>) {
    return {
      success: true,
      message,
      data,
    };
  }

  static error({ message, errors }: ErrorResponseOptions) {
    return {
      success: false,
      message,
      errors,
    };
  }
}
