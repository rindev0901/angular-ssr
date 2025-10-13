import { HttpInterceptorFn } from '@angular/common/http';

export const ApiBaseUrlInterceptor: HttpInterceptorFn = (req, next) => {
  const apiReq = req.clone({ withCredentials: true });
  return next(apiReq);
};
