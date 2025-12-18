/**
 * Worker Cookie 工具函数
 * Worker Cookie Utilities
 */

export interface CookieOptions {
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
  maxAge?: number;
  path?: string;
}

/**
 * 设置 Cookie
 */
export function setCookie(
  name: string,
  value: string,
  options: CookieOptions = {}
): string {
  const {
    httpOnly = false,
    secure = false,
    sameSite = 'lax',
    maxAge,
    path = '/',
  } = options;
  
  let cookie = `${name}=${value}; Path=${path}`;
  
  if (httpOnly) {
    cookie += '; HttpOnly';
  }
  
  if (secure) {
    cookie += '; Secure';
  }
  
  if (sameSite) {
    cookie += `; SameSite=${sameSite.charAt(0).toUpperCase() + sameSite.slice(1)}`;
  }
  
  if (maxAge !== undefined) {
    cookie += `; Max-Age=${maxAge}`;
  }
  
  return cookie;
}
