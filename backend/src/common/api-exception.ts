import { HttpException, HttpStatus } from '@nestjs/common';

export interface ApiFieldError {
  field?: string;
  code: string;
  message: string;
}

export class ApiException extends HttpException {
  constructor(
    status: HttpStatus,
    code: string,
    message: string,
    errors?: ApiFieldError[],
  ) {
    super({ code, message, errors }, status);
  }
}
