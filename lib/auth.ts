import jwt from 'jsonwebtoken';
import type { SessionToken } from './types';

export function signToken(payload: Omit<SessionToken, 'iat'|'exp'>) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET missing');
  return jwt.sign(payload, secret, { expiresIn: '7d' });
}

export function verifyAuth(authorizationHeader?: string): SessionToken | null {
  const token = authorizationHeader?.startsWith('Bearer ') ? authorizationHeader.slice(7) : null;
  if (!token) return null;
  try {
    const secret = process.env.JWT_SECRET!;
    return jwt.verify(token, secret) as SessionToken;
  } catch {
    return null;
  }
}
