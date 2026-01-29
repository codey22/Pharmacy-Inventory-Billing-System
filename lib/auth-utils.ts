import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// Secret key for signing the JWT. 
// In production, this should be in .env.local
const SECRET_KEY = process.env.JWT_SECRET_KEY || 'your-secret-key-change-this-in-production';
const key = new TextEncoder().encode(SECRET_KEY);

export async function encrypt(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h') // Session expires in 24 hours
    .sign(key);
}

export async function decrypt(input: string): Promise<any> {
  const { payload } = await jwtVerify(input, key, {
    algorithms: ['HS256'],
  });
  return payload;
}

export async function getSession() {
  const session = (await cookies()).get('session')?.value;
  if (!session) return null;
  try {
    return await decrypt(session);
  } catch (error) {
    return null;
  }
}

export async function checkAuthorization() {
  const session = await getSession();
  
  if (!session) {
    return { authorized: false, error: 'Unauthorized', status: 401 };
  }

  // Double check username matches the required Admin username
  // Although login route ensures this, it's good to be defensive
  if (session.username !== 'Admin') {
     return { authorized: false, error: 'Access Denied', status: 403 };
  }

  return { authorized: true, user: session };
}

export async function login(formData: FormData) {
  // This function is for Server Actions if used, 
  // but we are using API routes for now.
  // Leaving this as a placeholder or helper if needed.
}

export async function logout() {
  // Destroy the session
  (await cookies()).set('session', '', { expires: new Date(0) });
}
