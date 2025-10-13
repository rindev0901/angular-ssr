interface BaseResponse<T = undefined> {
  data?: T;
  retCode?: string;
  statusCode?: number;
}

export interface ApiResponse<T = undefined> extends BaseResponse<T> {
  message: string;
  success: boolean;
}

export class HttpResponse {
  static toResponse<T = undefined>(
    message: string,
    { statusCode = 500, retCode, data }: BaseResponse<T> | undefined = {}
  ): ApiResponse<T> {
    return {
      data,
      message: message,
      success: statusCode >= 200 && statusCode < 400,
      statusCode: statusCode,
      retCode: retCode,
    };
  }
}
