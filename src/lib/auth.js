import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'nexdb-dev-secret-change-in-production';
const TOKEN_EXPIRY = '7d';

export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

export function getTokenFromCookies(request) {
  const cookie = request.cookies.get('nexdb_token');
  return cookie?.value || null;
}

export function authenticate(request) {
  const token = getTokenFromCookies(request);
  if (!token) return null;
  return verifyToken(token);
}
