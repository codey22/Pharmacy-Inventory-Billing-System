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
        pharmacyName: { type: String, default: '' },
        pharmacyAddress: { type: String, default: '' },
        pharmacyPhone: { type: String, default: '' },
        pharmacyGstNo: { type: String, default: '' },
        defaultGstPercent: { type: Number, default: 0 },
        globalDiscountPercent: { type: Number, default: 0 },
        thresholdAmount: { type: Number, default: 0 },
        thresholdDiscountPercent: { type: Number, default: 0 },
        // razorpayKeyId: { type: String, default: '' }, // Deprecated
        // razorpayKeySecret: { type: String, default: '' }, // Deprecated
    },
    {
        timestamps: true,
    }
);

export default models.Settings || model<ISettings>('Settings', SettingsSchema);
