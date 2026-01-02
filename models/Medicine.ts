import mongoose, { Schema, model, models } from 'mongoose';

export interface IMedicine {
    _id: string;
    name: string;
    brandName: string;
    category: string;
    batchNumber: string;
    expiryDate: Date;
    purchasePrice: number;
    sellingPrice: number;
    quantityInStock: number;
    supplierName: string;
    gstPercentage: number;
    createdAt: Date;
    updatedAt: Date;
}

const MedicineSchema = new Schema<IMedicine>(
    {
        name: { type: String, required: true, index: true },
        brandName: { type: String, required: true },
        category: { type: String, required: true },
        batchNumber: { type: String, required: true },
        expiryDate: { type: Date, required: true, index: true },
        purchasePrice: { type: Number, required: true },
        sellingPrice: { type: Number, required: true },
        quantityInStock: { type: Number, required: true },
        supplierName: { type: String, required: true },
        gstPercentage: { type: Number, default: 12 },
    },
    {
        timestamps: true,
    }
);

export default models.Medicine || model<IMedicine>('Medicine', MedicineSchema);
