import React, { useState, useEffect } from 'react';
import api from '../../api/api';
import {
    ShieldCheck,
    Users,
    Building2,
    CheckCircle,
    XCircle,
    Clock,
    MoreHorizontal,
    LogOut,
    Bell,
    Search as SearchIcon
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import StatCard from '../../components/ui/StatCard';

const AdminDashboard = () => {
    const { user, logout } = useAuth();
    const [stats, setStats] = useState({ users: 0, businesses: 0, pending: 0 });
    const [businesses, setBusinesses] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('businesses');

    const fetchData = async () => {
        try {
            const [bizRes, usersRes] = await Promise.all([
                api.get('/admin/businesses'),
                api.get('/admin/users')
            ]);
            setBusinesses(bizRes.data.data);
            setUsers(usersRes.data.data);

            setStats({
                users: usersRes.data.data.length,
                businesses: bizRes.data.data.length,
                pending: bizRes.data.data.filter(b => b.status === 'pending').length
            });
        } catch (error) {
            console.error('Error fetching admin data', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleStatusUpdate = async (id, status) => {
        try {
            await api.put(`/admin/businesses/${id}/status`, { status });
            fetchData();
        } catch {
            alert('Failed to update status');
        }
    };

    if (loading) return (
        <div className="flex min-h-screen items-center justify-center bg-surface">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-navy/30 border-t-navy" />
        </div>
    );

    const SidebarItem = ({ icon: Icon, label, id }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`flex w-full items-center gap-4 rounded-2xl px-6 py-4 transition-colors ${
                activeTab === id ? 'bg-navy text-white' : 'text-ink-soft hover:bg-surface hover:text-ink'
            }`}
        >
            <Icon size={20} aria-hidden="true" />
            <span className="text-xs font-medium uppercase tracking-[0.18em]">{label}</span>
        </button>
    );

    return (
        <div className="flex min-h-screen bg-surface">
            <aside className="sticky top-0 flex h-screen w-72 flex-col justify-between border-r border-hairline bg-white p-8">
                <div className="space-y-10">
                    <div className="flex items-center gap-3">
                        <div className="grid h-10 w-10 place-items-center rounded-card bg-navy text-white">
                            <ShieldCheck size={22} aria-hidden="true" />
                        </div>
                        <span className="font-outfit text-lg font-medium tracking-tight text-ink">Admin</span>
                    </div>

                    <div className="space-y-2">
                        <SidebarItem icon={Building2} label="Parking locations" id="businesses" />
                        <SidebarItem icon={Users} label="User accounts" id="users" />
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="rounded-card border border-hairline bg-surface p-5">
                        <div className="flex items-center gap-3">
                            <span className="h-2 w-2 rounded-full bg-emerald-500" />
                            <span className="text-xs font-medium uppercase tracking-wide text-ink-soft">All systems normal</span>
                        </div>
                    </div>
                    <button onClick={logout} className="flex w-full items-center gap-3 px-2 py-3 text-ink-soft hover:text-red-500">
                        <LogOut size={18} aria-hidden="true" />
                        <span className="text-xs font-medium uppercase tracking-wide">Log out</span>
                    </button>
                </div>
            </aside>

            <main className="flex-1 overflow-y-auto p-10">
                <header className="mb-12 flex items-center justify-between">
                    <div>
                        <h1 className="font-outfit text-3xl font-medium tracking-tight text-ink">Admin dashboard</h1>
                        <p className="mt-1 text-sm text-ink-soft">Manage locations and accounts</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <button className="grid h-11 w-11 place-items-center rounded-card border border-hairline bg-white text-ink-soft hover:text-navy">
                                <Bell size={18} aria-hidden="true" />
                            </button>
                            {stats.pending > 0 && <span className="absolute right-0 top-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-red-500" />}
                        </div>
                        <div className="grid h-11 w-11 place-items-center rounded-card border border-hairline bg-white font-outfit font-medium text-ink">
                            {user.name.charAt(0)}
                        </div>
                    </div>
                </header>

                <div className="mb-10 grid grid-cols-1 gap-6 md:grid-cols-3">
                    <StatCard label="Total users" value={stats.users} icon={Users} />
                    <StatCard label="Registered businesses" value={stats.businesses} icon={Building2} />
                    <StatCard label="Pending approvals" value={stats.pending} icon={Clock} />
                </div>

                <div className="overflow-hidden rounded-card-lg border border-hairline bg-white">
                    <div className="flex items-center justify-between border-b border-hairline p-6">
                        <h3 className="font-outfit text-xl font-medium capitalize tracking-tight text-ink">{activeTab}</h3>
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <SearchIcon className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" aria-hidden="true" />
                                <input placeholder="Search records…" className="rounded-pill border border-hairline bg-surface py-2.5 pl-10 pr-5 text-xs text-ink focus:border-navy-light focus:outline-none" />
                            </div>
                            <Button variant="secondary" size="sm">Export</Button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        {activeTab === 'businesses' ? (
                            <table className="w-full text-left">
                                <thead className="bg-surface">
                                    <tr>
                                        <th className="px-8 py-4 text-xs font-medium uppercase tracking-wide text-ink-soft">Location</th>
                                        <th className="px-8 py-4 text-xs font-medium uppercase tracking-wide text-ink-soft">Rate</th>
                                        <th className="px-8 py-4 text-center text-xs font-medium uppercase tracking-wide text-ink-soft">Status</th>
                                        <th className="px-8 py-4 text-right text-xs font-medium uppercase tracking-wide text-ink-soft">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-hairline">
                                    {businesses.map((biz) => (
                                        <tr key={biz.id} className="hover:bg-surface/60">
                                            <td className="px-8 py-6">
                                                <div className="font-outfit text-lg font-medium text-ink">{biz.name}</div>
                                                <div className="mt-1 flex items-center gap-1 text-xs text-ink-soft">
                                                    <Building2 className="h-3 w-3" aria-hidden="true" />
                                                    {biz.address}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="font-outfit text-base text-ink">${biz.pricePerHour}<span className="ml-1 text-xs text-ink-soft">/hr</span></div>
                                                <div className="mt-1 text-xs text-ink-soft">Owner: {biz.owner?.name || 'Unknown'}</div>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <Badge variant={
                                                    biz.status === 'approved' ? 'success' :
                                                    biz.status === 'rejected' ? 'danger' :
                                                    'navy'
                                                }>
                                                    {biz.status}
                                                </Badge>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                {biz.status === 'pending' ? (
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => handleStatusUpdate(biz.id, 'approved')}
                                                            className="grid h-9 w-9 place-items-center rounded-full bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white"
                                                        >
                                                            <CheckCircle size={16} aria-hidden="true" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleStatusUpdate(biz.id, 'rejected')}
                                                            className="grid h-9 w-9 place-items-center rounded-full bg-red-50 text-red-500 hover:bg-red-500 hover:text-white"
                                                        >
                                                            <XCircle size={16} aria-hidden="true" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button className="p-2 text-ink-soft hover:text-ink">
                                                        <MoreHorizontal size={18} aria-hidden="true" />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <table className="w-full text-left">
                                <thead className="bg-surface">
                                    <tr>
                                        <th className="px-8 py-4 text-xs font-medium uppercase tracking-wide text-ink-soft">User</th>
                                        <th className="px-8 py-4 text-xs font-medium uppercase tracking-wide text-ink-soft">Role</th>
                                        <th className="px-8 py-4 text-right text-xs font-medium uppercase tracking-wide text-ink-soft">Joined</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-hairline">
                                    {users.map((u) => (
                                        <tr key={u.id} className="hover:bg-surface/60">
                                            <td className="px-8 py-6">
                                                <div className="font-outfit text-lg font-medium text-ink">{u.name}</div>
                                                <div className="mt-1 text-xs text-ink-soft">{u.email}</div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <Badge variant={
                                                    u.role === 'admin' ? 'navy' :
                                                    u.role === 'business' ? 'accent' :
                                                    'slate'
                                                }>
                                                    {u.role}
                                                </Badge>
                                            </td>
                                            <td className="px-8 py-6 text-right text-sm text-ink-soft">
                                                {new Date(u.createdAt).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AdminDashboard;
