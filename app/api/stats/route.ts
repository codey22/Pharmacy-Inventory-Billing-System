import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Medicine from '@/models/Medicine';
import Sale from '@/models/Sale';
import { auth } from '@clerk/nextjs/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectToDatabase();

        // 1. Total Medicines
        const totalMedicines = await Medicine.countDocuments();

        // 2. Today's Sales
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todaySales = await Sale.find({
            createdAt: { $gte: today }
        });
        const todaySalesAmount = todaySales.reduce((acc, sale) => acc + sale.totalAmount, 0);

        // 3. Low Stock Count
        const lowStockCount = await Medicine.countDocuments({
            quantityInStock: { $lt: 10 }
        });

        // 4. Expiring Soon Count (within 30 days)
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        const expiringSoonCount = await Medicine.countDocuments({
            expiryDate: { $lte: thirtyDaysFromNow, $gt: new Date() }
        });

        return NextResponse.json({
            totalMedicines,
            todaySalesAmount,
            lowStockCount,
            expiringSoonCount
        });
    } catch (error) {
        console.error('Stats GET error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
