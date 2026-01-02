'use client';

import React from 'react';
import { format } from 'date-fns';

interface InvoiceProps {
  sale: {
    invoiceNumber: string;
    customerName?: string;
    customerContact?: string;
    items: Array<{
      name: string;
      batchNumber: string;
      expiryDate: string;
      quantity: number;
      pricePerUnit: number;
      totalPrice: number;
      taxAmount: number;
      taxPercent?: number; // Optional to handle old records
    }>;
    subTotal: number;
    discount: number;
    totalTax: number;
    cgstAmount: number;
    sgstAmount: number;
    igstAmount: number;
    totalAmount: number;
    paymentMethod: string;
    pharmacyGstNo: string;
    createdAt: string;
    _v?: string; // Version marker for debugging
  } | null;
}

const safeDateFormat = (dateStr: any, formatStr: string) => {
  try {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'N/A';
    return format(date, formatStr);
  } catch (error) {
    return 'N/A';
  }
};

export const Invoice = React.forwardRef<HTMLDivElement, InvoiceProps>(({ sale }, ref) => {
  if (!sale) return null;

  // Calculate tax percentage for display
  const displayTaxPercent = sale.subTotal > 0 && sale.totalTax > 0
    ? ((sale.totalTax / sale.subTotal) * 100 / 2).toFixed(1)
    : '6.0'; // Default to 6.0% if calculation is not possible

  if (!sale.items) return null;

  return (
    <div ref={ref} className="invoice-container">
      <div className="invoice-header">
        <h1>INVOICE</h1>
        <div className="pharmacy-info">
          <div className="pharmacy-logo-row">

            <h2>PharmaManage</h2>
          </div>
          <p>123 Healthy Street, Wellness City</p>
          <p>Phone: +91 9876543210</p>
          <p><strong>GSTIN:</strong> {sale.pharmacyGstNo || '27AABCU1234F1Z5'}</p>
        </div>
      </div>

      <div className="invoice-details">
        <div className="row">
          <span><strong>Invoice #:</strong> {sale.invoiceNumber}</span>
          <span><strong>Date:</strong> {safeDateFormat(sale.createdAt, 'dd MMM yyyy, HH:mm')}</span>
        </div>
        <div className="row">
          <span><strong>Customer:</strong> {sale.customerName || 'Walk-in Customer'}</span>
          <span><strong>Contact:</strong> {(sale.customerContact && sale.customerContact !== 'N/A' && sale.customerContact.trim() !== '') ? sale.customerContact : 'Not Provided'}</span>
        </div>
        <div className="row">
          <span><strong>Payment Method:</strong> {(sale.paymentMethod && sale.paymentMethod.trim() !== '') ? sale.paymentMethod : 'Cash'}</span>
        </div>
      </div>

      <table className="invoice-table">
        <thead>
          <tr>
            <th>Item Name</th>
            <th>Batch</th>
            <th>Exp</th>
            <th>Qty</th>
            <th>Price</th>
            <th>Tax</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {sale.items.map((item, index) => (
            <tr key={index}>
              <td>{item.name}</td>
              <td>{item.batchNumber || 'N/A'}</td>
              <td>{safeDateFormat(item.expiryDate, 'MM/yy')}</td>
              <td>{item.quantity}</td>
              <td>₹{item.pricePerUnit?.toFixed(2) || '0.00'}</td>
              <td>₹{(item.taxAmount || 0).toFixed(2)}</td>
              <td>₹{item.totalPrice?.toFixed(2) || '0.00'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="invoice-summary">
        <div className="summary-row">
          <span>Subtotal:</span>
          <span>₹{sale.subTotal?.toFixed(2) || '0.00'}</span>
        </div>
        <div className="summary-row">
          <span>CGST ({displayTaxPercent}%):</span>
          <span>₹{(sale.cgstAmount || (sale.totalTax / 2) || 0).toFixed(2)}</span>
        </div>
        <div className="summary-row">
          <span>SGST ({displayTaxPercent}%):</span>
          <span>₹{(sale.sgstAmount || (sale.totalTax / 2) || 0).toFixed(2)}</span>
        </div>
        {sale.igstAmount > 0 && (
          <div className="summary-row">
            <span>IGST:</span>
            <span>₹{sale.igstAmount?.toFixed(2) || '0.00'}</span>
          </div>
        )}
        <div className="summary-row">
          <span>Discount:</span>
          <span>- ₹{sale.discount?.toFixed(2) || '0.00'}</span>
        </div>
        <div className="summary-row total">
          <span>Total Payable:</span>
          <span>₹{sale.totalAmount?.toFixed(2) || '0.00'}</span>
        </div>
      </div>

      <div className="invoice-footer">
        <div className="footer-thanks">
          <span>Thank you for choosing</span>

          <span>PharmaManage</span>
        </div>
        <p>Please keep this invoice for your records.</p>
        <div style={{ fontSize: '8px', color: '#eee', marginTop: '10px' }}>{sale._v || 'V1'}</div>
      </div>

      <style jsx>{`
        .invoice-container {
          padding: 40px;
          color: #000;
          background: #fff;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          max-width: 800px;
          margin: 0 auto;
        }
        .invoice-header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 2px solid #333;
          padding-bottom: 20px;
        }
        .invoice-header h1 {
          margin: 0 0 15px; /* Adjusted margin */
          font-size: 24px;
          letter-spacing: 2px;
          color: #333;
        }
        .pharmacy-info {
          margin-top: 15px; /* Added margin for spacing */
        }
        .pharmacy-logo-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin: 10px 0 5px;
        }
        .pharmacy-logo-row h2 {
          margin: 0;
          color: #000;
        }
        .logo-icon {
          color: #333;
        }
        .pharmacy-info p {
          margin: 2px 0;
          font-size: 14px;
          color: #666;
        }
        .invoice-details {
          margin-bottom: 30px;
        }
        .invoice-details .row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          font-size: 14px;
        }
        .invoice-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
        }
        .invoice-table th {
          text-align: left;
          background: #f4f4f4;
          padding: 12px;
          border-bottom: 2px solid #333;
          font-size: 14px;
        }
        .invoice-table td {
          padding: 12px;
          border-bottom: 1px solid #eee;
          font-size: 14px;
        }
        .invoice-summary {
          float: right;
          width: 250px;
        }
        .summary-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          font-size: 14px;
        }
        .summary-row.total {
          border-top: 2px solid #333;
          padding-top: 10px;
          margin-top: 10px;
          font-weight: bold;
          font-size: 18px;
        }
        .invoice-footer {
          margin-top: 60px;
          text-align: center;
          border-top: 1px solid #eee;
          padding-top: 20px;
          clear: both;
        }
        .footer-thanks {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          font-size: 14px;
          color: #666;
          margin-bottom: 5px;
        }
        .footer-pill {
          color: #666;
        }
        .invoice-footer p {
          margin: 5px 0;
          font-size: 12px;
          color: #999;
        }

        @media print {
          .invoice-container {
            padding: 20px;
            margin: 0;
          }
        }
      `}</style>
    </div>
  );
});

Invoice.displayName = 'Invoice';
