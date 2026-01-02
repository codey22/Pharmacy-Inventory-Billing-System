import mongoose, { Schema, model, models } from 'mongoose';

export interface ISaleItem {
    medicineId: mongoose.Types.ObjectId;
    name: string;
    batchNumber: string;
    expiryDate: Date;
    quantity: number;
    pricePerUnit: number;
    totalPrice: number;
    taxAmount: number;
    taxPercent: number;
    brandName?: string;
    category?: string;
}

export interface ISale {
    _id: string;
    invoiceNumber: string;
    customerName?: string;
    customerContact?: string;
    items: ISaleItem[];
    subTotal: number;
    discount: number;
    totalTax: number;
    cgstAmount: number;
    sgstAmount: number;
    igstAmount: number;
    totalAmount: number;
    totalProfit: number;
    paymentMethod: 'Cash' | 'Card' | 'UPI';
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    pharmacyGstNo: string;
    createdAt: Date;
}

const SaleSchema = new Schema<ISale>(
    {
        invoiceNumber: { type: String, required: true, unique: true, index: true },
        customerName: { type: String },
        customerContact: { type: String, index: true },
        items: [
            {
                medicineId: { type: Schema.Types.ObjectId, ref: 'Medicine', required: true },
                name: { type: String, required: true },
                batchNumber: { type: String, required: true },
                expiryDate: { type: Date, required: true },
                quantity: { type: Number, required: true },
                pricePerUnit: { type: Number, required: true },
                totalPrice: { type: Number, required: true },
                taxAmount: { type: Number, default: 0 },
                taxPercent: { type: Number, default: 12 },
                brandName: { type: String },
                category: { type: String },
            },
        ],
        subTotal: { type: Number, required: true },
        discount: { type: Number, default: 0 },
        totalTax: { type: Number, default: 0 },
        cgstAmount: { type: Number, default: 0 },
        sgstAmount: { type: Number, default: 0 },
        igstAmount: { type: Number, default: 0 },
        totalAmount: { type: Number, required: true },
        totalProfit: { type: Number, required: true },
        paymentMethod: { type: String, enum: ['Cash', 'Card', 'UPI'], default: 'Cash' },
        razorpayOrderId: { type: String },
        razorpayPaymentId: { type: String },
        pharmacyGstNo: { type: String },
        createdAt: { type: Date, default: Date.now, index: true },
    },
    {
        timestamps: false, // Using custom createdAt
    }
);

export default models.Sale || model<ISale>('Sale', SaleSchema);
