'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    LayoutDashboard,
    Package,
    CreditCard,
    BarChart3,
    Search,
    Settings,
    LogOut
} from 'lucide-react';
import styles from './Navbar.module.css';

const Navbar = () => {
    const pathname = usePathname();
    const router = useRouter();

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            router.push('/sign-in');
            router.refresh();
        } catch (error) {
            console.error('Logout failed', error);
        }
    };

    const navItems = [
        { name: 'Dashboard', href: '/', icon: LayoutDashboard },
        { name: 'Inventory', href: '/inventory', icon: Package },
        { name: 'Billing', href: '/billing', icon: CreditCard },
        { name: 'Reports', href: '/reports', icon: BarChart3 },
        { name: 'Sales', href: '/sales', icon: Search },
        { name: 'Settings', href: '/settings', icon: Settings },
    ];

    if (pathname?.startsWith('/sign-in')) {
        return null;
    }

    return (
        <nav className={styles.navbar}>
            <div className={styles.navbarContent}>
                <div className={styles.navbarLogo}>

                    <span>PharmaManage</span>
                </div>

                <div className={styles.navLinks}>
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`${styles.navItem} ${isActive ? styles.active : ''}`}
                            >
                                <Icon size={22} />
                                <span>{item.name}</span>
                            </Link>
                        );
                    })}
                </div>

                <div className={styles.navbarActions}>
                    <button 
                        onClick={handleLogout}
                        className={styles.navItem} 
                        style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'inherit' }}
                    >
                        <LogOut size={22} />
                        <span>Logout</span>
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
