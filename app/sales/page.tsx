'use client';

import { useState, useEffect } from 'react';
import { Search, Printer, User, Phone, X, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './sales.module.css';
import { format } from 'date-fns';
import { printInvoice } from '@/lib/invoiceUtils';

export default function SalesSearchPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [sales, setSales] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedSale, setSelectedSale] = useState<any>(null);
    const [showInvoiceModal, setShowInvoiceModal] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [settings, setSettings] = useState<any>(null);

    useEffect(() => {
        fetch('/api/settings')
            .then(res => res.json())
            .then(data => setSettings(data));
    }, []);

    const fetchSales = async (query: string) => {
        setLoading(true);
        try {
            // Even if query is empty, we might want to show recent sales? 
            // The prompt implies search is primary, but pagination usually implies browsing.
            // Let's assume empty query fetches all recent sales.
            const response = await fetch(`/api/sales/search?query=${query || ''}&page=${page}&limit=10`);
            const data = await response.json();

            if (data.sales) {
                setSales(data.sales);
                setTotalPages(data.totalPages);
            } else {
                setSales([]);
            }
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timeout = setTimeout(() => {
            fetchSales(searchTerm);
        }, 500);
        return () => clearTimeout(timeout);
    }, [searchTerm, page]);

    return (
        <div style={{ padding: '2rem' }}>
            <header style={{ marginBottom: '2rem' }}>
                <h1>Search Billings</h1>
                <p style={{ color: '#666' }}>Find and reprint invoices by customer name or phone number</p>
            </header>

            <div className="card mb-4" style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '1rem' }}>
                <Search size={24} style={{ color: '#666' }} />
                <input
                    type="text"
                    placeholder="Search by Name or Contact Number..."
                    className="input"
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                    style={{ flex: 1 }}
                />
            </div>

            <div className="card">
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '3rem' }}>
                        <Loader2 className="animate-spin" size={48} />
                        <p>Searching records...</p>
                    </div>
                ) : sales.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem' }}>
                        <div className="watermark">
                            <h2 className="watermark-text" style={{ margin: 0 }}>PharmaManage</h2>
                        </div>
                        <p className="muted-text" style={{ marginTop: '1.5rem' }}>
                            {searchTerm ? 'No bills found matching your search.' : 'Enter a name or contact number to find previous bills.'}
                        </p>
                    </div>
                ) : (
                    <>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ textAlign: 'left', borderBottom: '2px solid #eee' }}>
                                    <th style={{ padding: '1rem' }}>Invoice ID</th>
                                    <th style={{ padding: '1rem' }}>Date</th>
                                    <th style={{ padding: '1rem' }}>Customer</th>
                                    <th style={{ padding: '1rem' }}>Items (Brand | Category)</th>
                                    <th style={{ padding: '1rem' }}>Amount</th>
                                    <th style={{ padding: '1rem' }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sales.map((sale) => (
                                    <tr key={sale._id} style={{ borderBottom: '1px solid #eee' }}>
                                        <td style={{ padding: '1rem' }}><strong>{sale.invoiceNumber}</strong></td>
                                        <td style={{ padding: '1rem' }}>{format(new Date(sale.createdAt), 'dd MMM yyyy')}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <div>{sale.customerName || 'Walk-in'}</div>
                                            <div style={{ fontSize: '12px', color: '#666' }}>{sale.customerContact}</div>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ maxWidth: '300px', fontSize: '14px' }}>
                                                {sale.items.map((item: any, idx: number) => {
                                                    const med = item.medicineId || {};
                                                    return (
                                                        <div key={idx} style={{ marginBottom: '4px' }}>
                                                            • <strong>{item.name}</strong>
                                                            <span style={{ color: '#666', fontSize: '13px' }}>
                                                                {med.brandName ? `, ${med.brandName}` : ''}
                                                                {med.category ? `, ${med.category}` : ''}
                                                                {` x${item.quantity}`}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem' }}><strong>₹{sale.totalAmount?.toFixed(2) || '0.00'}</strong></td>
                                        <td style={{ padding: '1rem' }}>
                                            <button
                                                className="btn btn-outline btn-sm"
                                                onClick={() => printInvoice(sale, settings)}
                                            >
                                                <Printer size={16} />
                                                <span>Print</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', padding: '1.5rem', borderTop: '1px solid #eee' }}>
                                <button
                                    className="btn btn-outline"
                                    disabled={page === 1}
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    title="Previous Page"
                                >
                                    <ChevronLeft size={20} />
                                </button>
                                <span className="muted-text">Page {page} of {totalPages}</span>
                                <button
                                    className="btn btn-outline"
                                    disabled={page === totalPages}
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    title="Next Page"
                                >
                                    <ChevronRight size={20} />
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {
                showInvoiceModal && selectedSale && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                    }}>
                        <div className="card" style={{ width: '90%', maxWidth: '600px', padding: '2rem', textAlign: 'center', position: 'relative' }}>
                            <button
                                onClick={() => setShowInvoiceModal(false)}
                                style={{ position: 'absolute', top: '1rem', right: '1rem', border: 'none', background: 'none', cursor: 'pointer' }}
                            >
                                <X size={24} />
                            </button>
                            <h2 style={{ marginBottom: '1rem' }}>Bill Details</h2>
                            <p style={{ marginBottom: '2rem' }}>Invoice for <strong>{selectedSale.customerName || 'Walk-in'}</strong></p>

                            <div className={styles.modalActions}>
                                <button className="btn btn-primary" onClick={() => printInvoice(selectedSale, settings)}>
                                    <Printer size={20} />
                                    <span>Print Invoice</span>
                                </button>
                                <button className="btn btn-outline" onClick={() => setShowInvoiceModal(false)}>
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
