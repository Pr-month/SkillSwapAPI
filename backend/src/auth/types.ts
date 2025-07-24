import { Request } from 'express';

// фейковая стуктура payload JWT токена
export interface JwtPayload {
  sub: string;
  email: string;
  role: 'user' | 'admin';
}

export interface AuthRequest extends Request {
  user: JwtPayload;
}
