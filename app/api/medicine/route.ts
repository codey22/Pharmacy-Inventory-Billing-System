import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Medicine from '@/models/Medicine';
import { auth } from '@clerk/nextjs/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectToDatabase();

        const { searchParams } = new URL(request.url);
        const query = searchParams.get('query') || '';
        const category = searchParams.get('category') || '';
        const sortBy = searchParams.get('sortBy') || 'createdAt';
        const sortOrder = searchParams.get('sortOrder') || 'desc';

        const filter: any = {};
        if (query) {
            filter.$or = [
                { name: { $regex: query, $options: 'i' } },
                { brandName: { $regex: query, $options: 'i' } },
            ];
        }
        if (category) {
            filter.category = category;
        }

        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const skip = (page - 1) * limit;

        const totalCount = await Medicine.countDocuments(filter);
        const medicines = await Medicine.find(filter)
            .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
            .skip(skip)
            .limit(limit);

        return NextResponse.json({
            medicines,
            totalCount,
            totalPages: Math.ceil(totalCount / limit),
            currentPage: page
        });
    } catch (error) {
        console.error('Medicine GET error:', error);
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

        const newMedicine = new Medicine(data);
        await newMedicine.save();

        return NextResponse.json(newMedicine, { status: 201 });
    } catch (error) {
        console.error('Medicine POST error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
