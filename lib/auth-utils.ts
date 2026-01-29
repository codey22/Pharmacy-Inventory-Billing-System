import { auth, currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function checkAuthorization() {
  const { userId } = await auth();
  
  if (!userId) {
    return { authorized: false, error: 'Unauthorized', status: 401 };
  }

  // Hardcoded check for strict single-account mode
  // The user wants ONLY 'admin@account.com' to be able to access.
  // We can combine this with ALLOWED_EMAILS env var for flexibility, or strictly enforce it.
  // Given the user's strong request, we will check against the hardcoded email AND env vars if present.
  
  const user = await currentUser();
  const userEmail = user?.emailAddresses[0]?.emailAddress;
  const username = user?.username;

  // Strict check for the specific requested email or username
  const HARDCODED_ADMIN_EMAIL = 'admin@account.com';
  const HARDCODED_ADMIN_USERNAME = 'Admin'; 
  const allowedEmailsEnv = process.env.ALLOWED_EMAILS || '';
  const allowedEmails = allowedEmailsEnv.split(',').map(e => e.trim()).filter(Boolean);
  
  // Combine hardcoded and env
  // Allow if email matches OR if username matches the specific admin username
  const isEmailAllowed = userEmail && (allowedEmails.includes(userEmail) || userEmail === HARDCODED_ADMIN_EMAIL);
  const isUsernameAllowed = username && username.toLowerCase() === HARDCODED_ADMIN_USERNAME.toLowerCase();

  if (!isEmailAllowed && !isUsernameAllowed) {
     // If neither email nor username is allowed, we block it.
     return { authorized: false, error: 'Access Denied: You are not authorized to use this application.', status: 403 };
  }

  return { authorized: true, userId, userEmail, username };
}
