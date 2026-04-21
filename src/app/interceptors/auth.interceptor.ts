import { HttpEventType, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { tap } from 'rxjs';
import { User } from '../models/user.model';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const storage = typeof localStorage === 'undefined' ? null : localStorage;
  const userId = storage?.getItem('userId');

  const requestToSend = userId
    ? req.clone({
        setHeaders: {
          Authorization: `Bearer ${userId}`,
        },
      })
    : req;

  return next(requestToSend).pipe(
    tap((event) => {
      // Responsibility 2 & 3: Save on Login without modifying the response
      if (
        event instanceof HttpResponse &&
        event.type === HttpEventType.Response &&
        req.method === 'GET' &&
        req.url.includes('/users') &&
        req.params.has('email') &&
        req.params.has('password')
      ) {
        const users = event.body as User[];
        if (users && users.length > 0 && users[0].id) {
          storage?.setItem('userId', String(users[0].id));
          storage?.setItem('currentUser', JSON.stringify(users[0]));
        }
      }
    }),
  );
};
