import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Medicine from '@/models/Medicine';
import { auth } from '@clerk/nextjs/server';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        await connectToDatabase();
        const medicine = await Medicine.findById(id);

        if (!medicine) {
            return NextResponse.json({ error: 'Medicine not found' }, { status: 404 });
        }

        return NextResponse.json(medicine);
    } catch (error) {
        console.error('Medicine GET ID error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        await connectToDatabase();
        const data = await request.json();

        const updatedMedicine = await Medicine.findByIdAndUpdate(
            id,
            { $set: data },
            { new: true, runValidators: true }
        );

        if (!updatedMedicine) {
            return NextResponse.json({ error: 'Medicine not found' }, { status: 404 });
        }

        return NextResponse.json(updatedMedicine);
    } catch (error) {
        console.error('Medicine PUT error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        await connectToDatabase();
        const deletedMedicine = await Medicine.findByIdAndDelete(id);

        if (!deletedMedicine) {
            return NextResponse.json({ error: 'Medicine not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Medicine deleted successfully' });
    } catch (error) {
        console.error('Medicine DELETE error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
