import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Sale from '@/models/Sale';
import Medicine from '@/models/Medicine';
import Settings from '@/models/Settings';
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
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        const filter: any = {};
        if (startDate && endDate) {
            filter.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate),
            };
        }

        const sales = await Sale.find(filter).sort({ createdAt: -1 });
        return NextResponse.json(sales);
    } catch (error) {
        console.error('Sales GET error:', error);
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
        const settings = await Settings.findOne() || {};
        const { customerName, customerContact, items, subTotal, discount, totalAmount, paymentMethod } = await request.json();

        // 1. Generate unique invoice number
        const invoiceNumber = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        // 2. Fetch medicines to calculate profit, tax and check stock
        let totalProfit = 0;
        let totalTax = 0;
        const saleItems = [];

        for (const item of items) {
            const medicine = await Medicine.findById(item.medicineId);
            if (!medicine) {
                throw new Error(`Medicine not found: ${item.name}`);
            }
            if (medicine.quantityInStock < item.quantity) {
                throw new Error(`Insufficient stock for ${item.name}`);
            }

            const itemPrice = medicine.sellingPrice * item.quantity;
            const itemProfit = (medicine.sellingPrice - medicine.purchasePrice) * item.quantity;
            totalProfit += itemProfit;

            // Calculate GST for this item
            // Logic: If pharmacy has GST number OR Default GST % > 0, apply tax.
            const hasGst = !!(settings.pharmacyGstNo || (settings.defaultGstPercent && settings.defaultGstPercent > 0));
            const gstPercent = hasGst ? (medicine.gstPercentage || settings.defaultGstPercent || 12) : 0;
            
            const itemTax = (itemPrice * gstPercent) / 100;
            totalTax += itemTax;

            saleItems.push({
                medicineId: medicine._id,
                name: medicine.name,
                batchNumber: medicine.batchNumber,
                expiryDate: medicine.expiryDate,
                quantity: item.quantity,
                pricePerUnit: medicine.sellingPrice,
                totalPrice: itemPrice,
                taxAmount: itemTax,
                taxPercent: gstPercent,
                brandName: medicine.brandName || 'N/A',
                category: medicine.category || 'N/A',
            });

            // 3. Deduct stock
            medicine.quantityInStock -= item.quantity;
            await medicine.save();
        }

        // Adjust Total Profit by subtracting the discount given
        // Net Profit = (Selling Price - Purchase Price) - Discount
        totalProfit = totalProfit - discount;

        // Split totalTax into CGST and SGST (50/50)
        const cgstAmount = totalTax / 2;
        const sgstAmount = totalTax / 2;
        const igstAmount = 0;

        // 4. Create sale record
        const newSale = new Sale({
            invoiceNumber,
            customerName,
            customerContact,
            items: saleItems,
            subTotal,
            discount,
            totalTax,
            cgstAmount,
            sgstAmount,
            igstAmount,
            totalAmount,
            totalProfit,
            paymentMethod: paymentMethod || 'Cash',
            pharmacyGstNo: settings.pharmacyGstNo,
        });

        await newSale.save();

        // Refetch to ensure all database defaults and calculated fields are present
        const savedSale = await Sale.findById(newSale._id);

        return NextResponse.json(savedSale, { status: 201 });
    } catch (error: any) {
        console.error('Sales POST error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
