'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Package,
  AlertTriangle,
  Clock,
  Plus,
  TrendingUp,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import styles from './page.module.css';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalMedicines: 0,
    todaySalesAmount: 0,
    todayProfit: 0,
    lowStockCount: 0,
    expiringSoonCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch('/api/stats');
        if (!response.ok) {
          if (response.status === 401) {
            router.push('/sign-in');
            return;
          }
          setError('Failed to load dashboard stats');
          setStats({
            totalMedicines: 0,
            todaySalesAmount: 0,
            todayProfit: 0,
            lowStockCount: 0,
            expiringSoonCount: 0
          });
        } else {
          const data = await response.json();
          setStats({
            totalMedicines: Number(data.totalMedicines ?? 0),
            todaySalesAmount: Number(data.todaySalesAmount ?? 0),
            todayProfit: Number(data.todayProfit ?? 0),
            lowStockCount: Number(data.lowStockCount ?? 0),
            expiringSoonCount: Number(data.expiringSoonCount ?? 0)
          });
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
        setError('Failed to load dashboard stats');
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  const statCards = [
    { name: 'Total Medicines', value: String(stats.totalMedicines ?? 0), icon: Package, color: styles.wrapperPrimary },
    { name: "Today's Sales", value: `₹${(stats.todaySalesAmount || 0).toFixed(2)}`, icon: TrendingUp, color: styles.wrapperPrimary },
    { name: "Today's Profit", value: `₹${(stats.todayProfit || 0).toFixed(2)}`, icon: TrendingUp, color: styles.wrapperSuccess },
    { name: 'Low Stock', value: String(stats.lowStockCount ?? 0), icon: AlertTriangle, color: styles.wrapperWarning },
    { name: 'Expiring Soon', value: String(stats.expiringSoonCount ?? 0), icon: Clock, color: styles.wrapperDestructive },
  ];

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Loader2 className="animate-spin" size={48} />
        <p>Initializing Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <header className={styles.dashboardHeader}>
        <div>
          <h1>Dashboard</h1>
          <p className={styles.subtitle}>Welcome back to PharmaManage</p>
        </div>
        <div className={styles.quickActions}>
          <Link href="/billing" className="btn btn-primary">
            <Plus size={18} />
            <span>New Bill</span>
          </Link>
          <Link href="/inventory" className="btn btn-outline">
            <Plus size={18} />
            <span>Add Medicine</span>
          </Link>
        </div>
      </header>

      {error && (
        <div className="alert alert-destructive" style={{ marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      <section className={styles.statsGrid}>
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className={`${styles.statCard} card`}>
              <div className={`${styles.statIconWrapper} ${stat.color}`}>
                <Icon size={26} />
              </div>
              <div className={styles.statInfo}>
                <span className={styles.statLabel}>{stat.name}</span>
                <span className={styles.statValue}>{stat.value}</span>
              </div>
            </div>
          );
        })}
      </section>

      <div className="dashboard-content grid grid-2">
        <div className="card">
          <h2 className="mb-4">Quick Actions & Help</h2>
          <div className={styles.helpGrid}>
            <Link href="/inventory" className={styles.helpItem}>
              <strong>Inventory Search</strong>
              <span>Quickly check stock levels and expiry dates.</span>
            </Link>
            <Link href="/billing" className={styles.helpItem}>
              <strong>Billing System</strong>
              <span>Generate customer bills with auto-stock deduction.</span>
            </Link>
            <Link href="/reports" className={styles.helpItem}>
              <strong>Sales Reports</strong>
              <span>View daily and monthly performance metrics.</span>
            </Link>
          </div>
        </div>

        <div className="card">
          <h2 className="mb-4">System Alerts</h2>
          {stats.lowStockCount > 0 ? (
            <div className="alert alert-warning">
              <strong>Low Stock:</strong> {stats.lowStockCount} items are below 10 units. <Link href="/inventory">View List</Link>
            </div>
          ) : (
            <div className="alert alert-success">All stock levels are healthy.</div>
          )}

          {stats.expiringSoonCount > 0 ? (
            <div className="alert alert-destructive">
              <strong>Expiry Alert:</strong> {stats.expiringSoonCount} medicines expiring within 30 days.
            </div>
          ) : (
            <div className="alert alert-success">No medicines expiring soon.</div>
          )}
        </div>
      </div>

      <style jsx>{`
        .alert-success {
          background-color: hsla(var(--success), 0.1);
          border-color: hsla(var(--success), 0.2);
          color: hsla(var(--success), 1);
          padding: 1rem;
          border-radius: var(--radius);
          margin-bottom: 1rem;
        }
      `}</style>
    </div>
  );
}
