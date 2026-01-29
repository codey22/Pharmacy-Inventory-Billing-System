import { NextRequest, NextResponse } from 'next/server';
import { encrypt } from '@/lib/auth-utils';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { username, password } = body;

        // Hardcoded credentials as requested
        const VALID_USERNAME = 'Admin';
        const VALID_PASSWORD = 'admin@account1';

        if (username === VALID_USERNAME && password === VALID_PASSWORD) {
            // Create session
            const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
            const session = await encrypt({ username, expires });

            // Set cookie
            (await cookies()).set('session', session, { 
                expires, 
                httpOnly: true, 
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/' 
            });

            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });

    } catch (error) {
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
