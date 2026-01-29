import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const printInvoice = (sale: any, settings: any) => {
    const doc: any = new jsPDF();

    // ================= HEADER & BRANDING =================

    // 1. Centered "INVOICE" Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(30, 41, 59); // Dark Slate
    doc.text("INVOICE", 105, 20, { align: 'center' });

    // 2. Pharmacy Name (Top Left) - Logo REMOVED
    const headerX = 20; // Standard left margin
    const headerY = 32;

    doc.setFontSize(20);
    doc.setTextColor(37, 99, 235); // Blue Brand Color
    
    // Check if store name exists, otherwise default to "PharmaManage" or empty if desired
    const storeName = settings?.pharmacyName || sale.pharmacyName || "";
    if (storeName) {
        doc.text(storeName, headerX, headerY); 
    }

    // Pharmacy Details (Below Name)
    const detailsY = headerY + 8;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105); // Slate-500

    let currentY = detailsY;

    // Use settings first, then sale fallback
    const address = settings?.pharmacyAddress || sale.pharmacyAddress;
    if (address) {
        // Handle multiline address
        const splitAddress = doc.splitTextToSize(address, 80); // Wrap at 80 units
        doc.text(splitAddress, headerX, currentY);
        currentY += (splitAddress.length * 5); // Increment Y based on lines
    }

    const gstNo = settings?.gstNumber || sale.pharmacyGstNo;
    if (gstNo) {
        doc.text(`GSTIN: ${gstNo}`, headerX, currentY);
        currentY += 5;
    }

    const phone = settings?.contactNumber || sale.pharmacyPhone;
    if (phone) {
        doc.text(`Phone: ${phone}`, headerX, currentY);
        currentY += 5;
    }

    // Invoice Meta (Top Right)
    // Label changed to "Invoice ID:"
    const metaY = headerY - 2; // Slightly adjusted to align with PharmaManage baseline or top
    // Let's align top of block with PharmaManage text top effectively

    const labelX = 125;
    const valueX = 190;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);

    doc.text(`Invoice ID:`, labelX, metaY);
    doc.text(`${sale.invoiceNumber}`, valueX, metaY, { align: 'right' });

    // Helper for dd/MM/yyyy format
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', { // en-GB gives dd/mm/yyyy
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    doc.text(`Date:`, labelX, metaY + 5);
    doc.setFont("helvetica", "normal");
    doc.text(`${formatDate(sale.createdAt)}`, valueX, metaY + 5, { align: 'right' });

    // ================= CUSTOMER DETAILS =================
    const customerY = detailsY + 28; // Adjusted spacing

    // Divider
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(20, customerY - 5, 190, customerY - 5);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 41, 59);
    doc.text("Bill To:", 20, customerY + 2);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(sale.customerName || 'Walk-in Customer', 20, customerY + 8);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text(`Contact:`, 20, customerY + 14);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    doc.text(`${sale.customerContact || 'N/A'}`, 36, customerY + 14);

    // ================= ITEM TABLE =================
    // Only show tax columns if there is actually tax
    const hasTax = sale.totalTax > 0;
    
    const tableColumn = hasTax 
        ? ["Item", "Batch", "Exp", "Qty", "Unit Price", "CGST%", "SGST%", "Amount"]
        : ["Item", "Batch", "Exp", "Qty", "Unit Price", "Amount"];

    const tableRows: any[] = [];

    let totalCGST = 0;
    let totalSGST = 0;

    sale.items.forEach((item: any) => {
        const gstRate = item.taxPercent || 0;
        const cgstRate = gstRate / 2;
        const sgstRate = gstRate / 2;

        const amount = item.pricePerUnit * item.quantity;

        const itemData = [
            item.name,
            item.batchNumber || 'N/A',
            item.expiryDate ? formatDate(item.expiryDate) : 'N/A',
            item.quantity,
            `Rs. ${item.pricePerUnit.toFixed(2)}`
        ];

        if (hasTax) {
            itemData.push(`${cgstRate}%`);
            itemData.push(`${sgstRate}%`);
        }

        itemData.push(`Rs. ${amount.toFixed(2)}`);
        
        tableRows.push(itemData);
    });

    if (sale.totalTax) {
        totalCGST = sale.totalTax / 2;
        totalSGST = sale.totalTax / 2;
    }

    autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: customerY + 22,
        theme: 'plain',
        headStyles: {
            fillColor: [248, 250, 252],
            textColor: [30, 41, 59],
            fontStyle: 'bold',
            lineWidth: 0.1,
            lineColor: [226, 232, 240],
            halign: 'center',
            valign: 'middle',
            minCellHeight: 10
        },
        styles: {
            font: 'helvetica',
            fontSize: 9,
            cellPadding: 4,
            textColor: [51, 65, 85],
            lineWidth: 0.1,
            lineColor: [226, 232, 240],
            valign: 'middle'
        },
        columnStyles: hasTax ? {
            0: { cellWidth: 40, halign: 'left' },
            1: { halign: 'center' },
            2: { halign: 'center' },
            3: { halign: 'center' },
            4: { halign: 'right' },
            5: { halign: 'center' },
            6: { halign: 'center' },
            7: { halign: 'right', fontStyle: 'bold' }
        } : {
            0: { cellWidth: 50, halign: 'left' },
            1: { halign: 'center' },
            2: { halign: 'center' },
            3: { halign: 'center' },
            4: { halign: 'right' },
            5: { halign: 'right', fontStyle: 'bold' }
        }
    });

    // ================= TOTALS SECTION =================
    // @ts-ignore
    const finalY = doc.lastAutoTable.finalY + 10;

    // Left side: Payment Info
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(100, 116, 139);
    doc.text("Payment Method:", 20, finalY);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(30, 41, 59);
    doc.text(`${sale.paymentMethod || 'Cash'}`, 20, finalY + 6);

    // Right side: Math
    const rightColX = 135;
    const valueColX = 190;
    const lineHeight = 7;
    let totalY = finalY;

    const subTotal = (sale.totalAmount - (sale.totalTax || 0) + (sale.discount || 0));

    const addTotalRow = (label: string, value: string, isBold = false) => {
        doc.setFont("helvetica", isBold ? "bold" : "normal");
        doc.setTextColor(isBold ? 30 : 71, isBold ? 41 : 85, isBold ? 59 : 105);

        doc.text(label, rightColX, totalY);
        doc.text(value, valueColX, totalY, { align: 'right' });
        totalY += lineHeight;
    };

    addTotalRow("Subtotal:", `Rs. ${subTotal.toFixed(2)}`);
    
    if (hasTax) {
        addTotalRow("CGST:", `Rs. ${totalCGST.toFixed(2)}`);
        addTotalRow("SGST:", `Rs. ${totalSGST.toFixed(2)}`);
    }

    doc.setDrawColor(226, 232, 240);
    doc.line(rightColX, totalY - 4, 190, totalY - 4);

    if (hasTax) {
        addTotalRow("Total GST:", `Rs. ${(sale.totalTax || 0).toFixed(2)}`, true);
        totalY += 2;
    }

    if (sale.discount > 0) {
        addTotalRow("Discount:", `Rs. ${sale.discount.toFixed(2)}`);
    }

    doc.setFillColor(241, 245, 249);
    doc.roundedRect(rightColX - 5, totalY - 5, 65, 12, 1, 1, 'F');

    totalY += 2;
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 41, 59);
    addTotalRow("Grand Total:", `Rs. ${sale.totalAmount.toFixed(2)}`, true);

    // ================= FOOTER =================
    const footerY = 280;
    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(148, 163, 184);
    doc.text("Thank you for choosing PharmaManage!", 105, footerY, { align: "center" });
    doc.text("This is an electronic invoice. It doesn't require any signature.", 105, footerY + 5, { align: "center" });

    const pdfBlob = doc.output('blob');
    const blobUrl = URL.createObjectURL(pdfBlob);
    window.open(blobUrl, '_blank');
};
