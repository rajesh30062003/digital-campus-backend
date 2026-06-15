export class AppError extends Error {
  statusCode: number;
  status: string;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = true;
    if ((Error as any).captureStackTrace) {
      (Error as any).captureStackTrace(this, this.constructor);
    }
  }
}

export default AppError;
