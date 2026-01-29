import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Sale from '@/models/Sale';
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
        const query = searchParams.get('query');

        if (!query) {
            return NextResponse.json([]);
        }

        // Search by customer name or contact number (case-insensitive)
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const skip = (page - 1) * limit;

        const totalCount = await Sale.countDocuments({
            $or: [
                { customerName: { $regex: query, $options: 'i' } },
                { customerContact: { $regex: query, $options: 'i' } },
                { invoiceNumber: { $regex: query, $options: 'i' } }
            ]
        });

        // Search by customer name or contact number (case-insensitive)
        const sales = await Sale.find({
            $or: [
                { customerName: { $regex: query, $options: 'i' } },
                { customerContact: { $regex: query, $options: 'i' } },
                { invoiceNumber: { $regex: query, $options: 'i' } }
            ]
        })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('items.medicineId', 'name brandName category');

        return NextResponse.json({
            sales,
            totalCount,
            totalPages: Math.ceil(totalCount / limit),
            currentPage: page
        });
    } catch (error) {
        console.error('Sales Search error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
