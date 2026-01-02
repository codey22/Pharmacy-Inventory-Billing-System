import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Settings from '@/models/Settings';
import { auth } from '@clerk/nextjs/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectToDatabase();
        let settings = await Settings.findOne();

        if (!settings) {
            settings = await Settings.create({});
        }

        return NextResponse.json(settings);
    } catch (error) {
        console.error('Settings GET error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectToDatabase();
        const data = await request.json();

        let settings = await Settings.findOne();
        if (settings) {
            settings = await Settings.findByIdAndUpdate(settings._id, data, { new: true });
        } else {
            settings = await Settings.create(data);
        }

        return NextResponse.json(settings);
    } catch (error) {
        console.error('Settings POST error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
