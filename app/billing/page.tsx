'use client';

import { useState, useEffect, useRef } from 'react';
import Script from 'next/script';

import {
    Search,
    Trash2,
    Plus,
    Minus,
    User,
    CreditCard,
    Loader2,
    CheckCircle2,
    Printer,
    X,
    Phone,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import styles from './billing.module.css';
import { printInvoice } from '@/lib/invoiceUtils';

interface CartItem {
    medicineId: string;
    name: string;
    price: number;
    quantity: number;
    maxStock: number;
    gstPercentage: number;
    batchNumber: string;
    expiryDate: string;
}

export default function BillingPage() {
    const [customerName, setCustomerName] = useState('');
    const [customerContact, setCustomerContact] = useState('');
    const [settings, setSettings] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [discount, setDiscount] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Card' | 'UPI'>('Cash');
    const [loading, setLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [lastSale, setLastSale] = useState<any>(null);
    const [showInvoiceModal, setShowInvoiceModal] = useState(false);
    const [cartPage, setCartPage] = useState(1);

    const searchTimeout = useRef<any>(null);




    useEffect(() => {
        fetch('/api/settings')
            .then(res => res.json())
            .then(data => setSettings(data));
    }, []);

    useEffect(() => {
        if (searchTerm.length < 2) {
            setSearchResults([]);
            return;
        }

        if (searchTimeout.current) clearTimeout(searchTimeout.current);

        searchTimeout.current = setTimeout(async () => {
            try {
                const response = await fetch(`/api/medicine?query=${searchTerm}&limit=20`);
                const data = await response.json();
                setSearchResults(data.medicines || []);
                setShowResults(true);
            } catch (error) {
                console.error('Search error:', error);
            }
        }, 300);

        return () => clearTimeout(searchTimeout.current);
    }, [searchTerm]);

    const addToCart = (med: any) => {
        const existingItem = cart.find(item => item.medicineId === med._id);
        if (existingItem) {
            if (existingItem.quantity < med.quantityInStock) {
                setCart(cart.map(item =>
                    item.medicineId === med._id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                ));
            } else {
                alert('Insufficient stock');
            }
        } else {
            if (med.quantityInStock > 0) {
                setCart([...cart, {
                    medicineId: med._id,
                    name: med.name,
                    price: med.sellingPrice || 0,
                    quantity: 1,
                    maxStock: med.quantityInStock || 0,
                    gstPercentage: med.gstPercentage || settings?.defaultGstPercent || 12,
                    batchNumber: med.batchNumber || 'N/A',
                    expiryDate: med.expiryDate || ''
                }]);
            } else {
                alert('Item out of stock');
            }
        }
        setSearchTerm('');
        setShowResults(false);
    };

    const removeFromCart = (id: string) => {
        setCart(cart.filter(item => item.medicineId !== id));
    };

    const updateQuantity = (id: string, delta: number) => {
        setCart(cart.map(item => {
            if (item.medicineId === id) {
                const newQty = item.quantity + delta;
                if (newQty > 0 && newQty <= item.maxStock) {
                    return { ...item, quantity: newQty };
                }
            }
            return item;
        }));
    };

    const subTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const totalTax = cart.reduce((acc, item) => {
        const itemTotal = item.price * item.quantity;
        return acc + (itemTotal * item.gstPercentage) / 100;
    }, 0);

    // Dynamic Discount Logic
    const baseDiscountPercent = settings?.globalDiscountPercent || 0;
    const baseDiscount = (subTotal * baseDiscountPercent) / 100;

    let additionalDiscount = 0;
    if (settings?.thresholdAmount && subTotal >= settings.thresholdAmount) {
        const extraPercent = settings.thresholdDiscountPercent || 0;
        additionalDiscount = (subTotal * extraPercent) / 100;
    }

    // User can still manual override if they desire, but we auto-calculate first
    useEffect(() => {
        if (!discount && (baseDiscount || additionalDiscount)) {
            setDiscount(parseFloat((baseDiscount + additionalDiscount).toFixed(2)));
        }
    }, [subTotal, settings]);

    const totalAmount = (subTotal + totalTax) - discount;

    const completeSale = async (paymentDetails: any = {}) => {
        try {
            const response = await fetch('/api/sales', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customerName,
                    items: cart.map(item => ({
                        medicineId: item.medicineId,
                        name: item.name,
                        quantity: item.quantity,
                        price: item.price,
                        batchNumber: item.batchNumber,
                        expiryDate: item.expiryDate
                    })),
                    customerContact: customerContact.trim() || 'N/A',
                    subTotal,
                    discount,
                    totalAmount,
                    paymentMethod,
                    ...paymentDetails
                }),
            });

            if (response.ok) {
                const saleData = await response.json();
                setLastSale(saleData);
                setIsSuccess(true);
                setCart([]);
                setCustomerName('');
                setCustomerContact('');
                setDiscount(0);
                setShowInvoiceModal(true);
                setTimeout(() => setIsSuccess(false), 3000);
            } else {
                const err = await response.json();
                alert(`Error: ${err.error}`);
            }
        } catch (error) {
            alert('Failed to process sale');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (cart.length === 0) return;
        setLoading(true);
        // Only cash payments are supported now
        await completeSale();
    };

    return (
        <div className={styles.billingContainer}>
            <header className={styles.header}>
                <h1>Create New Bill</h1>
                <p className="muted-text">Generate invoices and update stock automatically</p>
            </header>

            <div className={styles.billingLayout}>
                <div className={styles.leftCol}>
                    <div className="card mb-4">
                        <div className="grid grid-2">
                            <div>
                                <label className="label">Customer Name</label>
                                <div className={styles.inputWithIcon}>
                                    <User size={20} />
                                    <input
                                        type="text"
                                        placeholder="Enter customer name..."
                                        className="input"
                                        value={customerName}
                                        onChange={(e) => setCustomerName(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="label">Customer Contact</label>
                                <div className={styles.inputWithIcon}>
                                    <Phone size={20} />
                                    <input
                                        type="text"
                                        placeholder="Enter phone number..."
                                        className="input"
                                        value={customerContact}
                                        onChange={(e) => setCustomerContact(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <h3 className="mb-4">Select Medicines</h3>
                        <div className={styles.searchContainer}>
                            <div className={styles.inputWithIcon}>
                                <Search size={20} />
                                <input
                                    type="text"
                                    placeholder="Search medicine name or brand..."
                                    className="input"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onFocus={() => setShowResults(true)}
                                />
                            </div>

                            {showResults && searchResults.length > 0 && (
                                <div className={styles.resultsDropdown}>
                                    {searchResults.map((med: any) => (
                                        <div
                                            key={med._id}
                                            className={styles.resultItem}
                                            onClick={() => addToCart(med)}
                                        >
                                            <div className={styles.resultInfo}>
                                                <strong>{med.name}</strong>
                                                <span>{med.brandName} • {med.category}</span>
                                            </div>
                                            <div className={styles.resultPrice}>
                                                <strong>₹{med.sellingPrice?.toFixed(2) || '0.00'}</strong>
                                                <span className={med.quantityInStock < 10 ? 'text-destructive' : ''}>
                                                    {med.quantityInStock} left
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className={styles.cartList}>
                            {cart.length === 0 ? (
                                <div className="watermark" style={{ minHeight: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                    <div className="flex items-center gap-3">
                                        <h2 className="watermark-text" style={{ margin: 0 }}>PharmaManage</h2>
                                    </div>
                                    <p className="muted-text" style={{ marginTop: '1.5rem' }}>Your cart is empty. Start by searching medicines.</p>
                                </div>
                            ) : (
                                <>
                                    <table className={styles.cartTable}>
                                        <thead>
                                            <tr>
                                                <th>Item</th>
                                                <th>Qty</th>
                                                <th>Price</th>
                                                <th>Total</th>
                                                <th></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {cart.slice((cartPage - 1) * 10, cartPage * 10).map((item) => (
                                                <tr key={item.medicineId}>
                                                    <td>
                                                        <div className={styles.cartItemName}>{item.name}</div>
                                                    </td>
                                                    <td>
                                                        <div className={styles.qtyControls}>
                                                            <button onClick={() => updateQuantity(item.medicineId, -1)}><Minus size={14} /></button>
                                                            <span>{item.quantity}</span>
                                                            <button onClick={() => updateQuantity(item.medicineId, 1)}><Plus size={14} /></button>
                                                        </div>
                                                    </td>
                                                    <td>₹{item.price?.toFixed(2) || '0.00'}</td>
                                                    <td><strong>₹{(item.price * item.quantity)?.toFixed(2) || '0.00'}</strong></td>
                                                    <td>
                                                        <button
                                                            className={styles.removeBtn}
                                                            onClick={() => removeFromCart(item.medicineId)}
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>

                                    {Math.ceil(cart.length / 10) > 1 && (
                                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '1rem' }}>
                                            <button
                                                className="btn btn-outline"
                                                disabled={cartPage === 1}
                                                onClick={() => setCartPage(p => Math.max(1, p - 1))}
                                                title="Previous Page"
                                            >
                                                <ChevronLeft size={20} />
                                            </button>
                                            <span className="muted-text">Page {cartPage} of {Math.ceil(cart.length / 10)}</span>
                                            <button
                                                className="btn btn-outline"
                                                disabled={cartPage === Math.ceil(cart.length / 10)}
                                                onClick={() => setCartPage(p => Math.min(Math.ceil(cart.length / 10), p + 1))}
                                                title="Next Page"
                                            >
                                                <ChevronRight size={20} />
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div className={styles.rightCol}>
                    <div className={`${styles.summaryCard} card`}>
                        <h3>Bill Summary</h3>

                        <div className={styles.summaryRows}>
                            <div className={styles.summaryRow}>
                                <span>Subtotal</span>
                                <span>₹{subTotal?.toFixed(2) || '0.00'}</span>
                            </div>
                            <div className={styles.summaryRow}>
                                <span>GST Total</span>
                                <span>₹{totalTax?.toFixed(2) || '0.00'}</span>
                            </div>
                            <div className={styles.summaryRow}>
                                <span>Discount</span>
                                <input
                                    type="number"
                                    className={styles.discountInput}
                                    value={discount}
                                    onChange={(e) => setDiscount(Number(e.target.value))}
                                />
                            </div>
                            <div className={`${styles.summaryRow} mb-4`}>
                                <span>Payment Method</span>
                                <select
                                    className="input"
                                    style={{ width: '120px', padding: '0.4rem' }}
                                    value={paymentMethod}
                                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                                >
                                    <option value="Cash">Cash</option>
                                    {/* Razorpay Disabled */}
                                </select>
                            </div>
                            <div className={`${styles.summaryRow} ${styles.totalRow}`}>
                                <span>Total Amount</span>
                                <span>₹{totalAmount?.toFixed(2) || '0.00'}</span>
                            </div>
                        </div>

                        <button
                            className="btn btn-primary w-full mt-4"
                            onClick={handleSubmit}
                            disabled={loading || cart.length === 0}
                        >
                            {loading ? (
                                <Loader2 className="animate-spin" size={20} />
                            ) : isSuccess ? (
                                <CheckCircle2 size={20} />
                            ) : (
                                <CreditCard size={20} />
                            )}
                            <span>{isSuccess ? 'Bill Generated!' : 'Complete Billing'}</span>
                        </button>

                        <p className={styles.note}>
                            * Medicine stock will be deducted automatically upon completion.
                        </p>
                    </div>
                </div>
            </div>

            {/* Invoice Success Modal */}
            {showInvoiceModal && lastSale && (
                <div className={styles.modalOverlay}>
                    <div className={`${styles.successModal} card`}>
                        <div className={styles.modalHeader}>
                            <div className={styles.successIcon}>
                                <CheckCircle2 size={48} className="text-success" />
                            </div>
                            <h2>Billing Successful!</h2>
                            <p>Invoice <strong>{lastSale.invoiceNumber}</strong> has been created.</p>
                            <button className={styles.closeBtn} onClick={() => setShowInvoiceModal(false)}>
                                <X size={24} />
                            </button>
                        </div>

                        <div className={styles.modalActions}>
                            <button className="btn btn-primary" onClick={() => printInvoice(lastSale)}>
                                <Printer size={20} />
                                <span>Print Invoice</span>
                            </button>
                            <button className="btn btn-outline" onClick={() => setShowInvoiceModal(false)}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}



            <style jsx global>{`
                .text-success { color: hsl(var(--success)); }
            `}</style>
        </div>
    );
}
