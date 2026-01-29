'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
    Plus,
    Search,
    Edit,
    Trash2,
    Filter,
    Loader2,
    PackageSearch,
    ChevronLeft,
    ChevronRight,
    Upload
} from 'lucide-react';
import styles from './inventory.module.css';
import MedicineForm from '@/components/MedicineForm';
import { format } from 'date-fns';

interface Medicine {
    _id: string;
    name: string;
    brandName: string;
    category: string;
    batchNumber: string;
    expiryDate: string;
    purchasePrice: number;
    sellingPrice: number;
    quantityInStock: number;
    supplierName: string;
}

export default function InventoryPage() {
    const [medicines, setMedicines] = useState<Medicine[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);

    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/inventory/import', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            if (res.ok) {
                alert(data.message);
                fetchMedicines();
            } else {
                alert('Error: ' + data.error);
                if (data.details) {
                    console.error('Import details:', data.details);
                }
            }
        } catch (err) {
            console.error('Upload failed', err);
            alert('Upload failed');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const fetchMedicines = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (searchQuery) params.append('query', searchQuery);
            if (categoryFilter) params.append('category', categoryFilter);
            params.append('page', page.toString());
            params.append('limit', '10');

            const response = await fetch(`/api/medicine?${params.toString()}`);
            const data = await response.json();

            if (data.medicines) {
                setMedicines(data.medicines);
                setTotalPages(data.totalPages);
            } else {
                setMedicines([]);
            }
        } catch (error) {
            console.error('Fetch error:', error);
        } finally {
            setLoading(false);
        }
    }, [searchQuery, categoryFilter, page]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchMedicines();
        }, 500);

        return () => clearTimeout(timer);
    }, [fetchMedicines]);

    const handleAddMedicine = async (formData: any) => {
        const response = await fetch('/api/medicine', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData),
        });
        if (response.ok) fetchMedicines();
    };

    const handleEditMedicine = async (formData: any) => {
        if (!editingMedicine) return;
        const response = await fetch(`/api/medicine/${editingMedicine._id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData),
        });
        if (response.ok) fetchMedicines();
    };

    const handleDeleteMedicine = async (id: string) => {
        if (confirm('Are you sure you want to delete this medicine?')) {
            const response = await fetch(`/api/medicine/${id}`, { method: 'DELETE' });
            if (response.ok) fetchMedicines();
        }
    };

    const openEditModal = (medicine: Medicine) => {
        setEditingMedicine(medicine);
        setIsModalOpen(true);
    };

    const openAddModal = () => {
        setEditingMedicine(null);
        setIsModalOpen(true);
    };

    return (
        <div className={styles.inventoryContainer}>
            <header className={styles.header}>
                <div>
                    <h1>Medicine Inventory</h1>
                    <p className="muted-text">Manage your stock levels and medicine details</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <input
                        type="file"
                        accept=".xlsx, .xls"
                        style={{ display: 'none' }}
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                    />
                    <button 
                        className="btn" 
                        style={{ backgroundColor: '#28a745', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        title="Upload Excel File with Medicine Details"
                    >
                        {isUploading ? <Loader2 className="animate-spin" size={20} /> : <Upload size={20} />}
                        <span>Import Excel</span>
                    </button>
                    <button className="btn btn-primary" onClick={openAddModal}>
                        <Plus size={20} />
                        <span>Add New Medicine</span>
                    </button>
                </div>
            </header>

            <div className={`${styles.controls} card`}>
                <div className={styles.searchWrapper}>
                    <Search className={styles.searchIcon} size={20} />
                    <input
                        type="text"
                        placeholder="Search by name or brand..."
                        className={`${styles.searchInput} input`}
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                    />
                </div>

                <div className={styles.filterWrapper}>
                    <select
                        className="input"
                        value={categoryFilter}
                        onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
                    >
                        <option value="">All Categories</option>
                        <option value="Tablet">Tablet</option>
                        <option value="Syrup">Syrup</option>
                        <option value="Injection">Injection</option>
                        <option value="Capsule">Capsule</option>
                        <option value="Ointment">Ointment</option>
                    </select>
                </div>
            </div>

            <div className={`${styles.tableWrapper} card`}>
                {loading ? (
                    <div className={styles.loader}>
                        <Loader2 className="animate-spin" size={40} />
                        <p>Loading medicines...</p>
                    </div>
                ) : medicines.length > 0 ? (
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Medicine Name</th>
                                <th>Brand</th>
                                <th>Category</th>
                                <th>Stock</th>
                                <th>Price</th>
                                <th>Expiry Date</th>
                                <th className={styles.actionsHeader}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {medicines.map((med) => (
                                <tr key={med._id}>
                                    <td>
                                        <div className={styles.medName}>
                                            <strong>{med.name}</strong>
                                            <span className={styles.batch}>Batch: {med.batchNumber}</span>
                                        </div>
                                    </td>
                                    <td>{med.brandName}</td>
                                    <td><span className={styles.tag}>{med.category}</span></td>
                                    <td>
                                        <span className={`${styles.stock} ${med.quantityInStock < 10 ? styles.lowStock : ''}`}>
                                            {med.quantityInStock} units
                                        </span>
                                    </td>
                                    <td>₹{med.sellingPrice?.toFixed(2) || '0.00'}</td>
                                    <td>
                                        <span className={`${styles.expiry} ${new Date(med.expiryDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) ? styles.expiringSoon : ''}`}>
                                            {format(new Date(med.expiryDate), 'MMM dd, yyyy')}
                                        </span>
                                    </td>
                                    <td className={styles.actions}>
                                        <button className={styles.actionBtn} onClick={() => openEditModal(med)} title="Edit">
                                            <Edit size={18} />
                                        </button>
                                        <button className={`${styles.actionBtn} ${styles.deleteBtn}`} onClick={() => handleDeleteMedicine(med._id)} title="Delete">
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className={styles.emptyState}>
                        <PackageSearch size={48} className="muted-text" />
                        <h3>No medicines found</h3>
                        <p>Adjust your search or add a new medicine.</p>
                    </div>
                )}
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

            <MedicineForm
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={editingMedicine ? handleEditMedicine : handleAddMedicine}
                initialData={editingMedicine}
                title={editingMedicine ? 'Edit Medicine' : 'Add New Medicine'}
            />
        </div>
    );
}
