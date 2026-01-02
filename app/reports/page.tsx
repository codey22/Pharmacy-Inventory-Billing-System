'use client';

import { useState, useEffect } from 'react';
import {
    BarChart3,
    Download,
    Calendar,
    ArrowUpRight,
    ArrowDownRight,
    TrendingUp,
    AlertCircle,
    Loader2,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import styles from './reports.module.css';
import { format } from 'date-fns';

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

export default function ReportsPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [expiredPage, setExpiredPage] = useState(1);
    const [lowStockPage, setLowStockPage] = useState(1);
    const [dateRange, setDateRange] = useState({
        startDate: format(new Date(new Date().setMonth(new Date().getMonth() - 1)), 'yyyy-MM-dd'),
        endDate: format(new Date(), 'yyyy-MM-dd'),
    });

    const fetchReports = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams(dateRange);
            params.append('page', page.toString());
            params.append('limit', '10');
            const response = await fetch(`/api/reports?${params.toString()}`);
            const result = await response.json();
            if (result.sales) {
                if (result.sales.pagination) {
                    setTotalPages(result.sales.pagination.totalPages);
                }
                setData(result);
            }
        } catch (error) {
            console.error('Failed to fetch reports:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, [dateRange, page]);

    const handleExport = async () => {
        try {
            // Fetch ALL data for the period (limit=0)
            const params = new URLSearchParams(dateRange);
            params.append('limit', '0'); // Request all records

            const response = await fetch(`/api/reports?${params.toString()}`);
            const result = await response.json();

            if (!result?.sales?.list || result.sales.list.length === 0) {
                alert('No data available to export.');
                return;
            }

            // Define headers
            const headers = [
                'Invoice ID',
                'Date',
                'Customer',
                'Item Names',
                'Brands',
                'Categories',
                'Total Amount',
                'Total Profit',
                'Payment Method'
            ];

            // Map data to rows
            const rows = result.sales.list.map((sale: any) => {
                // Aggregate item details
                const itemNames = sale.items.map((i: any) => `${i.name} (x${i.quantity})`).join(' | ');

                const brands = sale.items.map((i: any) => {
                    const med = i.medicineId || {};
                    return i.brandName || med.brandName || 'N/A';
                }).join(' | ');

                const categories = sale.items.map((i: any) => {
                    const med = i.medicineId || {};
                    return i.category || med.category || 'N/A';
                }).join(' | ');

                return [
                    sale.invoiceNumber,
                    format(new Date(sale.createdAt), 'yyyy-MM-dd HH:mm'),
                    sale.customerName || 'Walk-in',
                    itemNames,
                    brands,
                    categories,
                    sale.totalAmount.toFixed(2),
                    sale.totalProfit.toFixed(2),
                    sale.paymentMethod
                ];
            });

            // Combine headers and rows with CRLF and BOM for Excel compatibility
            const csvContent = '\uFEFF' + [
                headers.join(','),
                ...rows.map((row: any) => row.map((cell: string) => `"${cell}"`).join(',')) // Quote cells to handle commas
            ].join('\r\n');

            // Create blob and download
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Sales_Report_${dateRange.startDate}_to_${dateRange.endDate}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Export failed:', error);
            alert('Failed to generate export file.');
        }
    };

    if (loading && !data) {
        return (
            <div className={styles.loading}>
                <Loader2 className="animate-spin" size={40} />
                <p>Generating reports...</p>
            </div>
        );
    }

    return (
        <div className={styles.reportsContainer}>
            <header className={styles.header}>
                <div>
                    <h1>Reports & Analytics</h1>
                    <p className="muted-text">Track sales performance and inventory status</p>
                </div>
                <div className={styles.headerActions}>
                    <div className={styles.datePicker}>
                        <Calendar size={18} className="muted-text" />
                        <input
                            type="date"
                            value={dateRange.startDate}
                            onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                        />
                        <span>to</span>
                        <input
                            type="date"
                            value={dateRange.endDate}
                            onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                        />
                    </div>
                    <button className="btn btn-outline" onClick={handleExport}>
                        <Download size={18} />
                        <span>Export</span>
                    </button>
                </div>
            </header>

            {/* Sales Summary Cards */}
            <section className="grid grid-3 mb-4">
                <div className="card">
                    <div className={styles.statHeader}>
                        <span className="muted-text">Total Revenue</span>
                        <TrendingUp size={20} className="text-secondary" />
                    </div>
                    <div className={styles.statValue}>₹{(data?.sales?.summary?.totalRevenue || 0).toFixed(2)}</div>
                    {data?.sales?.summary?.growthPercentage !== undefined && (
                        <div className={styles.statTrend}>
                            {data.sales.summary.growthPercentage >= 0 ? (
                                <>
                                    <ArrowUpRight size={14} className="text-success" />
                                    <span className="text-success">+{data.sales.summary.growthPercentage}% from previous period</span>
                                </>
                            ) : (
                                <>
                                    <ArrowDownRight size={14} className="text-destructive" />
                                    <span className="text-destructive">{data.sales.summary.growthPercentage}% from previous period</span>
                                </>
                            )}
                        </div>
                    )}
                </div>

                <div className="card">
                    <div className={styles.statHeader}>
                        <span className="muted-text">Total Profit</span>
                        <TrendingUp size={20} className="text-success" />
                    </div>
                    <div className={styles.statValue}>₹{(data?.sales?.summary?.totalProfit || 0).toFixed(2)}</div>
                </div>

                <div className="card">
                    <div className={styles.statHeader}>
                        <span className="muted-text">Total Bills</span>
                        <BarChart3 size={20} className="text-primary" />
                    </div>
                    <div className={styles.statValue}>{data?.sales?.summary?.totalBills}</div>
                </div>
            </section>

            <div className="flex flex-col gap-4">
                {/* Sales History Table */}
                <div className="card">
                    <h2 className="mb-4">Recent Sales History</h2>
                    <div className={styles.tableWrapper}>
                        <table className={styles.reportTable}>
                            <thead>
                                <tr>
                                    <th>Invoice ID</th>
                                    <th>Date</th>
                                    <th>Customer</th>
                                    <th>Item Name</th>
                                    <th>Category</th>
                                    <th>Brand</th>
                                    <th>Amount</th>
                                    <th>Profit</th>
                                    <th>Payment Method</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data?.sales?.list?.map((sale: any) => (
                                    <tr key={sale._id}>
                                        <td><strong>{sale.invoiceNumber}</strong></td>
                                        <td>{safeDateFormat(sale.createdAt, 'MMM dd, HH:mm')}</td>
                                        <td>{sale.customerName || 'Walk-in'}</td>

                                        {/* Item Name List */}
                                        <td style={{ verticalAlign: 'top' }}>
                                            {sale.items.map((item: any, i: number) => (
                                                <div key={i} style={{ borderBottom: i < sale.items.length - 1 ? '1px solid #eee' : 'none', padding: '4px 0' }}>
                                                    {item.name} <span className="muted-text">x{item.quantity}</span>
                                                </div>
                                            ))}
                                        </td>

                                        {/* Category List */}
                                        <td style={{ verticalAlign: 'top' }}>
                                            {sale.items.map((item: any, i: number) => {
                                                const med = item.medicineId || {};
                                                return (
                                                    <div key={i} style={{ borderBottom: i < sale.items.length - 1 ? '1px solid #eee' : 'none', padding: '4px 0' }}>
                                                        {med.category || 'N/A'}
                                                    </div>
                                                );
                                            })}
                                        </td>

                                        {/* Brand List */}
                                        <td style={{ verticalAlign: 'top' }}>
                                            {sale.items.map((item: any, i: number) => {
                                                const med = item.medicineId || {};
                                                return (
                                                    <div key={i} style={{ borderBottom: i < sale.items.length - 1 ? '1px solid #eee' : 'none', padding: '4px 0' }}>
                                                        {med.brandName || 'N/A'}
                                                    </div>
                                                );
                                            })}
                                        </td>

                                        <td style={{ verticalAlign: 'top' }}>₹{(sale.totalAmount || 0).toFixed(2)}</td>
                                        <td className="text-success" style={{ verticalAlign: 'top' }}>₹{(sale.totalProfit || 0).toFixed(2)}</td>
                                        <td style={{ verticalAlign: 'top' }}>{sale.paymentMethod || 'Cash'}</td>
                                    </tr>
                                ))}
                                {data?.sales?.list?.length === 0 && (
                                    <tr>
                                        <td colSpan={9} className="text-center py-4">No sales found for this period.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '1.5rem', marginBottom: '2rem' }}>
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
                </div>
            </div>

            {/* Inventory Report Sections */}
            <div className="grid grid-2">
                <div className="card">
                    <h3 className="mb-4 flex items-center gap-2">
                        <AlertCircle size={20} className="text-destructive" />
                        Expired Medicines
                    </h3>
                    <ul className={styles.alertList}>
                        {data?.inventory?.expired?.slice((expiredPage - 1) * 10, expiredPage * 10).map((med: any) => (
                            <li key={med._id}>
                                <span>{med.name} (Batch: {med.batchNumber || 'N/A'})</span>
                                <span className="text-destructive">Expired: {safeDateFormat(med.expiryDate, 'MMM dd, yyyy')}</span>
                            </li>
                        ))}
                        {data?.inventory?.expired?.length === 0 && <li className="muted-text">No expired medicines.</li>}
                    </ul>
                    {data?.inventory?.expired?.length > 10 && (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '1rem' }}>
                            <button
                                className="btn btn-outline"
                                disabled={expiredPage === 1}
                                onClick={() => setExpiredPage(p => Math.max(1, p - 1))}
                                title="Previous Page"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <span className="muted-text" style={{ fontSize: '0.8rem' }}>Page {expiredPage}</span>
                            <button
                                className="btn btn-outline"
                                disabled={expiredPage === Math.ceil(data.inventory.expired.length / 10)}
                                onClick={() => setExpiredPage(p => Math.min(Math.ceil(data.inventory.expired.length / 10), p + 1))}
                                title="Next Page"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    )}
                </div>

                <div className="card">
                    <h3 className="mb-4 flex items-center gap-2">
                        <AlertCircle size={20} className="text-warning" />
                        Low Stock Medicines
                    </h3>
                    <ul className={styles.alertList}>
                        {data?.inventory?.lowStock?.slice((lowStockPage - 1) * 10, lowStockPage * 10).map((med: any) => (
                            <li key={med._id}>
                                <span>{med.name}</span>
                                <span className="text-warning">{med.quantityInStock} units left</span>
                            </li>
                        ))}
                        {data?.inventory?.lowStock?.length === 0 && <li className="muted-text">All stock levels are adequate.</li>}
                    </ul>
                    {data?.inventory?.lowStock?.length > 10 && (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '1rem' }}>
                            <button
                                className="btn btn-outline"
                                disabled={lowStockPage === 1}
                                onClick={() => setLowStockPage(p => Math.max(1, p - 1))}
                                title="Previous Page"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <span className="muted-text" style={{ fontSize: '0.8rem' }}>Page {lowStockPage}</span>
                            <button
                                className="btn btn-outline"
                                disabled={lowStockPage === Math.ceil(data.inventory.lowStock.length / 10)}
                                onClick={() => setLowStockPage(p => Math.min(Math.ceil(data.inventory.lowStock.length / 10), p + 1))}
                                title="Next Page"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
