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

        const { searchParams } = new URL(request.url);
        const startDateParam = searchParams.get('startDate');
        const endDateParam = searchParams.get('endDate');

        const startDate = startDateParam
            ? new Date(new Date(startDateParam).setHours(0, 0, 0, 0))
            : new Date(new Date().setMonth(new Date().getMonth() - 1));

        const endDate = endDateParam
            ? new Date(new Date(endDateParam).setHours(23, 59, 59, 999))
            : new Date();

        // Ensure start date starts at 00:00:00 if it was defaulted
        if (!startDateParam) startDate.setHours(0, 0, 0, 0);

        // 1. Sales Summary (Calculate from ALL matching docs)
        const allSalesForSummary = await Sale.find({
            createdAt: { $gte: startDate, $lte: endDate }
        });

        const totalRevenue = allSalesForSummary.reduce((acc, s) => acc + s.totalAmount, 0);
        const totalProfit = allSalesForSummary.reduce((acc, s) => acc + s.totalProfit, 0);
        const totalBills = allSalesForSummary.length;

        // 2. Paginated Sales List
        const page = parseInt(searchParams.get('page') || '1');
        const limitParam = searchParams.get('limit');
        const limit = limitParam === '0' ? 0 : parseInt(limitParam || '10');
        const skip = limit === 0 ? 0 : (page - 1) * limit;

        const query = Sale.find({
            createdAt: { $gte: startDate, $lte: endDate }
        })
            .sort({ createdAt: -1 })
            .skip(skip)
            .populate('items.medicineId', 'brandName category');

        if (limit > 0) {
            query.limit(limit);
        }

        const paginatedSales = await query;

        // 2. Growth Calculation (Revenue comparison with previous equivalent period)
        const diffInMs = endDate.getTime() - startDate.getTime();
        const prevEndDate = new Date(startDate.getTime() - 1);
        const prevStartDate = new Date(prevEndDate.getTime() - diffInMs);

        const prevSales = await Sale.find({
            createdAt: { $gte: prevStartDate, $lte: prevEndDate }
        });
        const prevRevenue = prevSales.reduce((acc, s) => acc + s.totalAmount, 0);

        // Growth % formula: ((current - prev) / prev) * 100
        let growthPercentage = 0;
        if (prevRevenue > 0) {
            growthPercentage = ((totalRevenue - prevRevenue) / prevRevenue) * 100;
        } else if (totalRevenue > 0) {
            growthPercentage = 100; // 100% growth if prev was 0
        }

        // 3. Inventory Alert Reports
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

        const inventoryReport = {
            lowStock: await Medicine.find({ quantityInStock: { $lt: 10 } }),
            expired: await Medicine.find({ expiryDate: { $lt: new Date() } }),
            expiringSoon: await Medicine.find({
                expiryDate: { $lte: thirtyDaysFromNow, $gt: new Date() }
            }),
        };

        return NextResponse.json({
            sales: {
                list: paginatedSales,
                summary: {
                    totalRevenue,
                    totalProfit,
                    totalBills,
                    growthPercentage: parseFloat(growthPercentage.toFixed(1))
                },
                pagination: {
                    totalCount: totalBills,
                    totalPages: Math.ceil(totalBills / limit),
                    currentPage: page
                }
            },
            inventory: inventoryReport,
            range: { startDate, endDate }
        });
    } catch (error) {
        console.error('Reports GET error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
