import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Medicine from '@/models/Medicine';
import { checkAuthorization } from '@/lib/auth-utils';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const authResult = await checkAuthorization();
        if (!authResult.authorized) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        await connectToDatabase();

        const { searchParams } = new URL(request.url);
        const query = searchParams.get('query') || '';
        const category = searchParams.get('category') || '';
        
        // Default sort: if searching, prioritize expiry date (asc) to sell old stock first.
        // Otherwise default to newest created items.
        let defaultSortBy = 'createdAt';
        let defaultSortOrder = 'desc';
        
        if (query) {
            defaultSortBy = 'expiryDate';
            defaultSortOrder = 'asc';
        }

        const sortBy = searchParams.get('sortBy') || defaultSortBy;
        const sortOrder = searchParams.get('sortOrder') || defaultSortOrder;

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
        const authResult = await checkAuthorization();
        if (!authResult.authorized) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
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
