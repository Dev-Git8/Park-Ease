import React, { useState, useEffect } from 'react';
import api from '../../api/api';
import { 
    ShieldCheck, 
    Users, 
    Building2, 
    CheckCircle, 
    XCircle, 
    Clock, 
    Search, 
    MoreHorizontal,
    LayoutDashboard,
    Activity,
    Settings,
    LogOut,
    Plus,
    Bell,
    ArrowUpRight,
    Search as SearchIcon
} from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';

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
        <div className="min-h-screen flex items-center justify-center bg-brand-light-bg dark:bg-brand-dark transition-colors duration-300">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-yellow"></div>
        </div>
    );

    const SidebarItem = ({ icon: Icon, label, id }) => (
        <button 
            onClick={() => setActiveTab(id)}
            className={`
                w-full flex items-center space-x-4 px-6 py-4 rounded-2xl transition-all duration-300 group
                ${activeTab === id 
                    ? 'bg-brand-yellow text-brand-black shadow-yellow' 
                    : 'text-slate-500 hover:text-brand-black dark:text-slate-500 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-brand-dark-card'
                }
            `}
        >
            <Icon size={20} className={`${activeTab === id ? 'text-brand-black' : 'text-slate-400 group-hover:text-brand-black dark:group-hover:text-white'}`} />
            <span className="text-xs font-black uppercase tracking-[0.2em]">{label}</span>
        </button>
    );

    return (
        <div className="min-h-screen bg-brand-light-bg dark:bg-brand-dark flex transition-all duration-300">
            {/* Sidebar */}
            <aside className="w-80 border-r border-slate-100 dark:border-brand-dark-card bg-white dark:bg-brand-dark sticky top-0 h-screen p-8 flex flex-col justify-between">
                <div className="space-y-12">
                     <div className="flex items-center space-x-3 px-2">
                        <div className="w-10 h-10 bg-brand-black text-brand-yellow rounded-xl flex items-center justify-center shadow-2xl">
                            <ShieldCheck size={24} strokeWidth={3} />
                        </div>
                        <span className="text-xl font-black text-brand-black dark:text-white tracking-tighter uppercase italic">ADMIN.CENTRAL</span>
                    </div>

                    <div className="space-y-2">
                        <SidebarItem icon={Building2} label="Parking Locations" id="businesses" />
                        <SidebarItem icon={Users} label="User Accounts" id="users" />
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-slate-50 dark:bg-brand-dark-card p-6 rounded-3xl border border-slate-100 dark:border-white/5 space-y-4">
                        <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-500 animate-pulse"></div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Admin Active</span>
                        </div>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">System administrator mode active. System monitoring active.</p>
                    </div>
                    <button onClick={logout} className="w-full flex items-center space-x-4 px-6 py-4 text-slate-400 hover:text-red-500 transition-colors group">
                        <LogOut size={20} />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Logout Admin</span>
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 p-12 overflow-y-auto">
                <header className="flex items-center justify-between mb-16">
                    <div>
                        <h1 className="text-4xl font-black text-brand-black dark:text-white tracking-tighter uppercase mb-2">Admin Dashboard</h1>
                        <p className="text-slate-400 dark:text-slate-500 font-bold text-xs uppercase tracking-[0.3em]">Global System Management</p>
                    </div>
                    <div className="flex items-center space-x-6">
                         <div className="relative">
                            <button className="p-3 bg-white dark:bg-brand-dark-card rounded-xl border border-slate-100 dark:border-white/5 text-slate-400 hover:text-brand-yellow transition-all">
                                <Bell size={20} />
                            </button>
                            <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-brand-dark"></span>
                         </div>
                         <div className="w-12 h-12 bg-slate-100 dark:bg-brand-dark-card rounded-xl border border-slate-200 dark:border-white/5 flex items-center justify-center font-black text-brand-black dark:text-white uppercase italic">
                             {user.name.charAt(0)}
                         </div>
                    </div>
                </header>

                {/* System Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                     {[
                         { label: 'Total Active Users', value: stats.users, icon: Users, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
                         { label: 'Registered Businesses', value: stats.businesses, icon: Building2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                         { label: 'Pending Approvals', value: stats.pending, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10', alert: stats.pending > 0 }
                     ].map((stat, i) => (
                         <div key={i} className="bg-white dark:bg-brand-dark-card p-8 rounded-[2.5rem] border border-slate-50 dark:border-brand-dark-card shadow-sm hover:shadow-premium transition-all relative overflow-hidden group">
                              {stat.alert && (
                                  <div className="absolute top-6 right-6 flex h-3 w-3">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-yellow opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-yellow"></span>
                                  </div>
                              )}
                              <div className={`w-12 h-12 ${stat.bg} rounded-xl flex items-center justify-center mb-6`}>
                                   <stat.icon className={stat.color} size={24} />
                              </div>
                              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest mb-1">{stat.label}</p>
                              <h3 className="text-4xl font-black text-brand-black dark:text-white font-outfit uppercase tracking-tighter">{stat.value}</h3>
                         </div>
                     ))}
                </div>

                {/* Main Oversight Terminal */}
                <div className="bg-white dark:bg-brand-dark-card rounded-[3rem] border border-slate-50 dark:border-white/5 shadow-premium overflow-hidden">
                    <div className="p-8 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
                         <h3 className="text-2xl font-black text-brand-black dark:text-white tracking-tight uppercase">Management: {activeTab}</h3>
                         <div className="flex items-center space-x-4">
                              <div className="relative">
                                 <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                 <input placeholder="Search records..." className="bg-slate-50 dark:bg-brand-dark border-none py-2.5 pl-10 pr-6 rounded-xl text-xs font-bold text-brand-black dark:text-white focus:ring-2 focus:ring-brand-yellow/20 outline-none" />
                              </div>
                              <Button variant="secondary" size="sm">Export Records</Button>
                         </div>
                    </div>
                    
                    <div className="overflow-x-auto">
                        {activeTab === 'businesses' ? (
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 dark:bg-brand-dark">
                                    <tr>
                                        <th className="px-10 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Location Details</th>
                                        <th className="px-10 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Rate & Pricing</th>
                                        <th className="px-10 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center">Approval Status</th>
                                        <th className="px-10 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                                    {businesses.map((biz) => (
                                        <tr key={biz.id} className="group hover:bg-slate-50/50 dark:hover:bg-brand-dark transition-colors">
                                            <td className="px-10 py-8">
                                                <div className="text-xl font-black text-brand-black dark:text-white uppercase tracking-tight mb-1">{biz.name}</div>
                                                <div className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-widest flex items-center italic">
                                                    <Building2 className="w-3 h-3 mr-1 text-brand-yellow" />
                                                    {biz.address}
                                                </div>
                                            </td>
                                            <td className="px-10 py-8">
                                                <div className="text-lg font-black text-brand-black dark:text-white font-outfit">
                                                    ${biz.pricePerHour} <span className="text-[10px] text-slate-400 uppercase ml-1">per hour</span>
                                                </div>
                                                <div className="text-slate-500 dark:text-slate-500 text-[10px] font-bold mt-1 uppercase tracking-widest">OWNER: {biz.owner?.name || 'Unknown'}</div>
                                            </td>
                                            <td className="px-10 py-8 text-center">
                                                <Badge variant={
                                                    biz.status === 'approved' ? 'success' :
                                                    biz.status === 'rejected' ? 'danger' :
                                                    'brand'
                                                }>
                                                    {biz.status}
                                                </Badge>
                                            </td>
                                            <td className="px-10 py-8 text-right">
                                                {biz.status === 'pending' ? (
                                                    <div className="flex items-center justify-end space-x-3">
                                                        <button 
                                                            onClick={() => handleStatusUpdate(biz.id, 'approved')}
                                                            className="w-10 h-10 bg-emerald-500/10 text-emerald-500 rounded-xl flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
                                                        >
                                                            <CheckCircle size={18} />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleStatusUpdate(biz.id, 'rejected')}
                                                            className="w-10 h-10 bg-red-500/10 text-red-500 rounded-xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm"
                                                        >
                                                            <XCircle size={18} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button className="p-2 text-slate-200 hover:text-slate-400 transition-colors">
                                                         <MoreHorizontal size={20} />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 dark:bg-brand-dark">
                                    <tr>
                                        <th className="px-10 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">User Detail</th>
                                        <th className="px-10 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Role</th>
                                        <th className="px-10 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Registration Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                                    {users.map((u) => (
                                        <tr key={u.id} className="group hover:bg-slate-50/50 dark:hover:bg-brand-dark transition-colors">
                                            <td className="px-10 py-8">
                                                <div className="text-xl font-black text-brand-black dark:text-white uppercase tracking-tight mb-1">{u.name}</div>
                                                <div className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-widest italic">{u.email}</div>
                                            </td>
                                            <td className="px-10 py-8">
                                                <Badge variant={
                                                    u.role === 'admin' ? 'brand' :
                                                    u.role === 'business' ? 'accent' :
                                                    'slate'
                                                }>
                                                    {u.role}
                                                </Badge>
                                            </td>
                                            <td className="px-10 py-8 text-slate-400 dark:text-slate-500 text-xs font-bold font-outfit text-right">
                                                Joined: {new Date(u.createdAt).toLocaleDateString()}
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
