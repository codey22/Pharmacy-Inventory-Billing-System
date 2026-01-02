import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
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
        if (!settings || !settings.razorpayKeyId || !settings.razorpayKeySecret) {
            return NextResponse.json({ error: 'Razorpay keys not configured in Settings' }, { status: 400 });
        }

        const { amount, currency = 'INR', receipt } = await request.json();

        const razorpay = new Razorpay({
            key_id: settings.razorpayKeyId,
            key_secret: settings.razorpayKeySecret,
        });

        const options = {
            amount: Math.round(amount * 100), // Razorpay expects amount in paise
            currency,
            receipt,
        };

        const order = await razorpay.orders.create(options);
        return NextResponse.json(order);
    } catch (error) {
        console.error('Razorpay Order error:', error);
        return NextResponse.json({ error: 'Failed to create Razorpay order' }, { status: 500 });
    }
}
