import { NextRequest, NextResponse } from 'next/server';
import { checkAuthorization } from '@/lib/auth-utils';
import dbConnect from '@/lib/mongodb';
import Medicine from '@/models/Medicine';
import * as XLSX from 'xlsx';

export async function POST(req: NextRequest) {
  const auth = await checkAuthorization();
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    
    // Assume first sheet
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const data = XLSX.utils.sheet_to_json(sheet);

    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'Sheet is empty' }, { status: 400 });
    }

    await dbConnect();

    const results = {
      added: 0,
      errors: 0,
      details: [] as string[]
    };

    // Iterate and insert
    for (const row of data as any[]) {
      try {
        // Map fields. Expecting column names to match or be similar.
        // We will try to be flexible with casing.
        const getField = (keys: string[]) => {
          for (const key of keys) {
            if (row[key] !== undefined) return row[key];
            // Try lowercase check
            const found = Object.keys(row).find(k => k.toLowerCase() === key.toLowerCase());
            if (found) return row[found];
          }
          return undefined;
        };

        const name = getField(['name', 'Medicine Name', 'MedicineName']);
        const batchNumber = getField(['batchNumber', 'Batch', 'Batch Number']);
        // Excel date might be number or string
        let expiryDateVal = getField(['expiryDate', 'Expiry', 'Expiry Date']);
        
        // Handle Excel Date (number) to JS Date
        let expiryDate: Date;
        if (typeof expiryDateVal === 'number') {
            // Excel date serial number
            expiryDate = new Date((expiryDateVal - (25567 + 2)) * 86400 * 1000); 
        } else {
            expiryDate = new Date(expiryDateVal);
        }

        const quantityInStock = Number(getField(['quantity', 'quantityInStock', 'Stock', 'Quantity']));
        const purchasePrice = Number(getField(['purchasePrice', 'Purchase Price', 'Buying Price']));
        const sellingPrice = Number(getField(['sellingPrice', 'Selling Price', 'MRP', 'Price']));
        const brandName = getField(['brandName', 'Brand', 'Company']);
        const category = getField(['category', 'Category', 'Type']) || 'General'; // Default if missing
        const supplierName = getField(['supplierName', 'Supplier', 'Distributor', 'Wholesaler', 'Wholesaler Name', 'Whole Seller']) || 'Unknown';
        const gstPercentage = Number(getField(['gstPercentage', 'GST', 'Tax'])) || 12;

        if (!name || !batchNumber || !quantityInStock || !purchasePrice || !sellingPrice) {
            results.errors++;
            results.details.push(`Skipped row (Missing required fields): ${JSON.stringify(row)}`);
            continue;
        }

        // Upsert based on name and batch? Or just create?
        // "new medicine add" implies create.
        // We'll use updateOne with upsert to avoid duplicates for same batch
        await Medicine.updateOne(
            { name, batchNumber },
            {
                $set: {
                    name,
                    brandName: brandName || name, // Fallback
                    category,
                    batchNumber,
                    expiryDate,
                    purchasePrice,
                    sellingPrice,
                    quantityInStock, // This overwrites. If we want to add, we'd need logic. But "upload excel ... details required for a new medicine" suggests setting up data.
                    supplierName,
                    gstPercentage
                }
            },
            { upsert: true }
        );
        results.added++;

      } catch (err) {
        results.errors++;
        results.details.push(`Error processing row: ${(err as Error).message}`);
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Processed ${data.length} rows. Added/Updated: ${results.added}. Errors: ${results.errors}`,
      details: results.details
    });

  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json({ error: 'Failed to process file' }, { status: 500 });
  }
}
