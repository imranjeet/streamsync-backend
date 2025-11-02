export class ApiResponse<T> {
  status: 'success' | 'error';
  code?: string | number;
  message?: string;
  details?: any;
  data?: T;

  constructor(status: 'success' | 'error', data?: T, message?: string, code?: string | number, details?: any) {
    this.status = status;
    this.data = data;
    this.message = message;
    this.code = code;
    this.details = details;
  }

  static success<T>(data: T, message?: string): ApiResponse<T> {
    return new ApiResponse('success', data, message);
  }

  static error(message: string, code?: string | number, details?: any): ApiResponse<null> {
    return new ApiResponse('error', null, message, code, details);
  }
}

