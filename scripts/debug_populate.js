
const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

// Define Minimal Schemas
const MedicineSchema = new mongoose.Schema({
    name: String,
    brandName: String,
    category: String
});
const Medicine = mongoose.models.Medicine || mongoose.model('Medicine', MedicineSchema);

const SaleSchema = new mongoose.Schema({
    items: [{
        medicineId: { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine' }
    }]
});
const Sale = mongoose.models.Sale || mongoose.model('Sale', SaleSchema);

async function testPopulate() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const rawSale = await Sale.findOne();
        console.log('RAW SALE:', JSON.stringify(rawSale, null, 2));

        const sale = await Sale.findOne().populate('items.medicineId');
        if (!sale) {
            console.log('No sales found');
            return;
        }

        console.log('First Sale ID:', sale._id);
        if (sale.items.length > 0) {
            const firstItem = sale.items[0];
            console.log('First Item MedicineID:', firstItem.medicineId);
            console.log('Is Populated?', firstItem.medicineId && typeof firstItem.medicineId === 'object');
        } else {
            console.log('Sale has no items');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

testPopulate();
