import { HttpInterceptorFn } from '@angular/common/http';
import { ApiConfig } from '../../config/api.config';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('accessToken');
  const isApiRequest = ApiConfig.isApiRequest(req.url);

  if (!token || !isApiRequest) {
    return next(req);
  }

  return next(
    req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    })
  );
};
