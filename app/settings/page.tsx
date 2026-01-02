'use client';

import { useState, useEffect } from 'react';
import { Save, Store, Percent, IndianRupee, CreditCard, ShieldCheck, Loader2, CheckCircle2 } from 'lucide-react';

export default function SettingsPage() {
    const [settings, setSettings] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        fetch('/api/settings')
            .then(res => res.json())
            .then(data => {
                setSettings(data);
                setLoading(false);
            });
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const response = await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            });
            if (response.ok) {
                setSaved(true);
                setTimeout(() => setSaved(false), 3000);
            }
        } catch (error) {
            console.error('Save error:', error);
        } finally {
            setSaving(false);
        }
    };

    if (loading || !settings) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
                <Loader2 className="animate-spin" size={48} />
            </div>
        );
    }

    return (
        <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
            <header style={{ marginBottom: '2rem' }}>
                <h1>Pharmacy Settings</h1>
                <p style={{ color: '#666' }}>Manage your pharmacy details, tax rates, and discount rules</p>
            </header>

            <form onSubmit={handleSave}>
                <div className="grid grid-2" style={{ gap: '2rem' }}>
                    {/* Pharmacy Information */}
                    <div className="card">
                        <h2 className="mb-4 flex items-center gap-2">
                            <Store size={24} className="text-primary" />
                            Store Information
                        </h2>
                        <div className="mb-4">
                            <label className="label">Pharmacy Name</label>
                            <input
                                type="text"
                                className="input"
                                value={settings.pharmacyName}
                                onChange={(e) => setSettings({ ...settings, pharmacyName: e.target.value })}
                            />
                        </div>
                        <div className="mb-4">
                            <label className="label">Pharmacy Address</label>
                            <textarea
                                className="input"
                                style={{ minHeight: '80px' }}
                                value={settings.pharmacyAddress}
                                onChange={(e) => setSettings({ ...settings, pharmacyAddress: e.target.value })}
                            />
                        </div>
                        <div className="mb-4">
                            <label className="label">Contact Phone</label>
                            <input
                                type="text"
                                className="input"
                                value={settings.pharmacyPhone}
                                onChange={(e) => setSettings({ ...settings, pharmacyPhone: e.target.value })}
                            />
                        </div>
                        <div className="mb-4">
                            <label className="label">GSTIN (Pharmacy GST Number)</label>
                            <input
                                type="text"
                                className="input"
                                value={settings.pharmacyGstNo}
                                onChange={(e) => setSettings({ ...settings, pharmacyGstNo: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Tax & Discount Controls */}
                    <div className="card">
                        <h2 className="mb-4 flex items-center gap-2">
                            <Percent size={24} className="text-secondary" />
                            Tax & Discounts
                        </h2>
                        <div className="mb-4">
                            <label className="label">Default GST % (Total)</label>
                            <input
                                type="number"
                                className="input"
                                value={settings.defaultGstPercent}
                                onChange={(e) => setSettings({ ...settings, defaultGstPercent: Number(e.target.value) })}
                            />
                            <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>This will be split 50/50 into CGST and SGST on invoices.</p>
                        </div>
                        <div className="mb-4">
                            <label className="label">Global Discount % (Base)</label>
                            <input
                                type="number"
                                className="input"
                                value={settings.globalDiscountPercent}
                                onChange={(e) => setSettings({ ...settings, globalDiscountPercent: Number(e.target.value) })}
                            />
                        </div>
                        <div className="mb-4">
                            <label className="label">Threshold for Extra Discount (₹)</label>
                            <input
                                type="number"
                                className="input"
                                value={settings.thresholdAmount}
                                onChange={(e) => setSettings({ ...settings, thresholdAmount: Number(e.target.value) })}
                            />
                        </div>
                        <div className="mb-4">
                            <label className="label">Additional Discount % (above threshold)</label>
                            <input
                                type="number"
                                className="input"
                                value={settings.thresholdDiscountPercent}
                                onChange={(e) => setSettings({ ...settings, thresholdDiscountPercent: Number(e.target.value) })}
                            />
                        </div>
                    </div>

                    {/* Razorpay Integration */}
                    <div className="card" style={{ gridColumn: 'span 2' }}>
                        <h2 className="mb-4 flex items-center gap-2">
                            <CreditCard size={24} className="text-success" />
                            Razorpay Payment Gateway
                        </h2>
                        <div className="grid grid-2" style={{ gap: '1rem' }}>
                            <div>
                                <label className="label">Razorpay Key ID</label>
                                <input
                                    type="text"
                                    className="input"
                                    placeholder="rzp_test_..."
                                    value={settings.razorpayKeyId}
                                    onChange={(e) => setSettings({ ...settings, razorpayKeyId: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="label">Razorpay Key Secret</label>
                                <input
                                    type="password"
                                    className="input"
                                    placeholder="••••••••••••"
                                    value={settings.razorpayKeySecret}
                                    onChange={(e) => setSettings({ ...settings, razorpayKeySecret: e.target.value })}
                                />
                            </div>
                        </div>
                        <div style={{ marginTop: '1rem', padding: '1rem', background: 'hsl(var(--secondary) / 0.1)', borderRadius: '8px' }}>
                            <p style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <ShieldCheck size={16} />
                                Payments will be processed through Razorpay Secure Checkout for Card and UPI.
                            </p>
                        </div>
                    </div>
                </div>

                <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={saving}
                        style={{ height: '50px', padding: '0 3rem' }}
                    >
                        {saving ? <Loader2 className="animate-spin" /> : saved ? <CheckCircle2 /> : <Save />}
                        <span>{saving ? 'Saving...' : saved ? 'Settings Saved!' : 'Save Controls'}</span>
                    </button>
                </div>
            </form>
        </div>
    );
}
