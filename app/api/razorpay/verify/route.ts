import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import connectToDatabase from '@/lib/mongodb';
import Settings from '@/models/Settings';
import { auth } from '@clerk/nextjs/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectToDatabase();
        const settings = await Settings.findOne();
        if (!settings || !settings.razorpayKeySecret) {
            return NextResponse.json({ error: 'Razorpay keys not configured' }, { status: 400 });
        }

        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await request.json();

        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac("sha256", settings.razorpayKeySecret)
            .update(body.toString())
            .digest("hex");

        const isSignatureValid = expectedSignature === razorpay_signature;

        if (isSignatureValid) {
            return NextResponse.json({ status: "ok" });
        } else {
            return NextResponse.json({ status: "verification_failed" }, { status: 400 });
        }
    } catch (error) {
        console.error('Razorpay Verification error:', error);
        return NextResponse.json({ error: 'Verification error' }, { status: 500 });
    }
}
