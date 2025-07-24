import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

interface Owner {
  password?: string;
}

interface OwnerData {
  owner?: Owner;
}

interface ResponseData {
  data: OwnerData[];
}

@Injectable()
export class UserPasswordFilter implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ResponseData> {
    return next.handle().pipe(
      map((response: ResponseData) => {
        if (response && Array.isArray(response.data)) {
          response.data.forEach((item: OwnerData) => {
            if (item.owner) {
              delete item.owner.password;
            }
          });
        }
        return response;
      }),
    );
  }
}
