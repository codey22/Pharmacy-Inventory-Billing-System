'use client';

import { useState, useEffect } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import styles from './MedicineForm.module.css';

interface MedicineFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => Promise<void>;
    initialData?: any;
    title: string;
}

const MedicineForm = ({ isOpen, onClose, onSubmit, initialData, title }: MedicineFormProps) => {
    const [formData, setFormData] = useState({
        name: '',
        brandName: '',
        category: 'Tablet',
        batchNumber: '',
        expiryDate: '',
        purchasePrice: '',
        sellingPrice: '',
        quantityInStock: '',
        supplierName: '',
        gstPercentage: '12',
    });

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (initialData) {
            // Format date for input
            const date = new Date(initialData.expiryDate);
            const formattedDate = date.toISOString().split('T')[0];
            setFormData({
                name: initialData.name || '',
                brandName: initialData.brandName || '',
                category: initialData.category || 'Tablet',
                batchNumber: initialData.batchNumber || '',
                expiryDate: formattedDate,
                purchasePrice: initialData.purchasePrice || '',
                sellingPrice: initialData.sellingPrice || '',
                quantityInStock: initialData.quantityInStock || '',
                supplierName: initialData.supplierName || '',
                gstPercentage: initialData.gstPercentage || '12',
            });
        } else {
            setFormData({
                name: '',
                brandName: '',
                category: 'Tablet',
                batchNumber: '',
                expiryDate: '',
                purchasePrice: '',
                sellingPrice: '',
                quantityInStock: '',
                supplierName: '',
                gstPercentage: '12',
            });
        }
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSubmit(formData);
            onClose();
        } catch (error) {
            console.error('Form submission error:', error);
            alert('Failed to save medicine');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.overlay}>
            <div className={`${styles.modal} card`}>
                <div className={styles.modalHeader}>
                    <h2>{title}</h2>
                    <button onClick={onClose} className={styles.closeBtn}>
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className="grid grid-2">
                        <div>
                            <label className="label">Medicine Name</label>
                            <input
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className="input"
                                required
                                placeholder="e.g. Paracetamol"
                            />
                        </div>
                        <div>
                            <label className="label">Brand Name</label>
                            <input
                                name="brandName"
                                value={formData.brandName}
                                onChange={handleChange}
                                className="input"
                                required
                                placeholder="e.g. Panadol"
                            />
                        </div>
                    </div>

                    <div className="grid grid-3">
                        <div>
                            <label className="label">Category</label>
                            <select
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                className="input"
                            >
                                <option value="Tablet">Tablet</option>
                                <option value="Syrup">Syrup</option>
                                <option value="Injection">Injection</option>
                                <option value="Capsule">Capsule</option>
                                <option value="Ointment">Ointment</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div>
                            <label className="label">Batch Number</label>
                            <input
                                name="batchNumber"
                                value={formData.batchNumber}
                                onChange={handleChange}
                                className="input"
                                required
                            />
                        </div>
                        <div>
                            <label className="label">Expiry Date</label>
                            <input
                                type="date"
                                name="expiryDate"
                                value={formData.expiryDate}
                                onChange={handleChange}
                                className="input"
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-3">
                        <div>
                            <label className="label">Purchase Price (₹)</label>
                            <input
                                type="number"
                                step="0.01"
                                name="purchasePrice"
                                value={formData.purchasePrice}
                                onChange={handleChange}
                                className="input"
                                required
                            />
                        </div>
                        <div>
                            <label className="label">Selling Price (₹)</label>
                            <input
                                type="number"
                                step="0.01"
                                name="sellingPrice"
                                value={formData.sellingPrice}
                                onChange={handleChange}
                                className="input"
                                required
                            />
                        </div>
                        <div>
                            <label className="label">Stock Quantity</label>
                            <input
                                type="number"
                                name="quantityInStock"
                                value={formData.quantityInStock}
                                onChange={handleChange}
                                className="input"
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-2">
                        <div>
                            <label className="label">Wholesaler / Supplier Name</label>
                            <input
                                name="supplierName"
                                value={formData.supplierName}
                                onChange={handleChange}
                                className="input"
                                required
                            />
                        </div>
                        <div>
                            <label className="label">GST Percentage (%)</label>
                            <input
                                type="number"
                                name="gstPercentage"
                                value={formData.gstPercentage}
                                onChange={handleChange}
                                className="input"
                                required
                                min="0"
                                max="100"
                            />
                        </div>
                    </div>

                    <div className={styles.formActions}>
                        <button type="button" onClick={onClose} className="btn btn-outline">Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                            <span>{initialData ? 'Update Medicine' : 'Save Medicine'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default MedicineForm;
