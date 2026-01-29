import mongoose, { Schema, model, models } from 'mongoose';

export interface ISettings {
    pharmacyName: string;
    pharmacyAddress: string;
    pharmacyPhone: string;
    pharmacyGstNo: string;
    defaultGstPercent: number; // For SGST (50%) and CGST (50%)
    globalDiscountPercent: number;
    thresholdAmount: number;
    thresholdDiscountPercent: number;
    // razorpayKeyId: string; // Deprecated
    // razorpayKeySecret: string; // Deprecated
}

const SettingsSchema = new Schema<ISettings>(
    {
        pharmacyName: { type: String, default: 'PharmaManage' },
        pharmacyAddress: { type: String, default: '123 Healthy Street, Wellness City' },
        pharmacyPhone: { type: String, default: '+91 9876543210' },
        pharmacyGstNo: { type: String, default: '27AABCU1234F1Z5' },
        defaultGstPercent: { type: Number, default: 12 },
        globalDiscountPercent: { type: Number, default: 5 },
        thresholdAmount: { type: Number, default: 2000 },
        thresholdDiscountPercent: { type: Number, default: 2 },
        // razorpayKeyId: { type: String, default: '' }, // Deprecated
        // razorpayKeySecret: { type: String, default: '' }, // Deprecated
    },
    {
        timestamps: true,
    }
);

export default models.Settings || model<ISettings>('Settings', SettingsSchema);
