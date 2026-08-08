import React, { useState, useEffect } from 'react';
import api from '../../api/api';
import {
    LayoutDashboard,
    Plus,
    Activity,
    Settings,
    LogOut,
    Car,
    ShieldCheck,
    MoreHorizontal,
    Search,
    Bell,
    X,
    Trash2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';
import StatCard from '../../components/ui/StatCard';
import { motion, AnimatePresence } from 'framer-motion';

const BusinessDashboard = () => {
    const { logout } = useAuth();
    const [stats, setStats] = useState({ totalSlots: 0, activeBookings: 0, totalRevenue: 0 });
    const [slots, setSlots] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [business, setBusiness] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const socket = useSocket();

    const [showBusinessSetup, setShowBusinessSetup] = useState(false);
    const [showAddSlots, setShowAddSlots] = useState(false);

    const [bizForm, setBizForm] = useState({ name: '', address: '', totalSlots: 10, price: 5, image: null });
    const [slotForm, setSlotForm] = useState({ prefix: 'A', count: 5 });
    const [showEditBusiness, setShowEditBusiness] = useState(false);
    const [editForm, setEditForm] = useState({ name: '', address: '', price: 0, image: null });
    const [actionLoading, setActionLoading] = useState(false);

    const fetchSlotsAndBookings = async (bizId) => {
        try {
            const [slotsRes, bookingsRes] = await Promise.all([
                api.get(`/slots/${bizId}`),
                api.get(`/bookings/business/${bizId}`)
            ]);

            const fetchedSlots = slotsRes.data.data || [];
            const fetchedBookings = bookingsRes.data.data || [];

            setSlots(fetchedSlots);
            setBookings(fetchedBookings);

            setStats({
                totalSlots: fetchedSlots.length,
                activeBookings: fetchedBookings.filter(b => b.status === 'booked' || b.status === 'active').length,
                totalRevenue: fetchedBookings.reduce((acc, curr) => acc + (parseFloat(curr.totalPrice) || 0), 0)
            });
        } catch (error) {
            console.error('Error fetching slots and bookings', error);
        }
    };

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const bizRes = await api.get('/business/my');
                const bizArray = bizRes.data.data;

                if (!bizArray || bizArray.length === 0) {
                    setShowBusinessSetup(true);
                    setLoading(false);
                    return;
                }

                const biz = bizArray[0];
                setBusiness(biz);

                await fetchSlotsAndBookings(biz.id);

            } catch (error) {
                console.error('Error fetching dashboard data', error);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, []);

    useEffect(() => {
        if (!socket || !business) return;

        socket.emit('joinBusinessRoom', business.id);

        socket.on('slotsUpdated', (data) => {
            if (data.businessId.toString() === business.id.toString()) {
                fetchSlotsAndBookings(business.id);
            }
        });

        return () => {
            socket.emit('leaveBusinessRoom', business.id);
            socket.off('slotsUpdated');
        };
    }, [socket, business]);

    const handleRegisterBusiness = async (e) => {
        e.preventDefault();
        setActionLoading(true);
        try {
            const formData = new FormData();
            formData.append('name', bizForm.name);
            formData.append('address', bizForm.address);
            formData.append('totalSlots', bizForm.totalSlots);
            formData.append('price', bizForm.price);
            if (bizForm.image) {
                formData.append('image', bizForm.image);
            }

            await api.post('/business/register', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setShowBusinessSetup(false);
            window.location.reload();
        } catch (err) {
            alert(err.response?.data?.message || 'Error registering business');
        } finally {
            setActionLoading(false);
        }
    };

    const handleUpdateBusiness = async (e) => {
        e.preventDefault();
        if (!business) return;
        setActionLoading(true);
        try {
            const formData = new FormData();
            formData.append('name', editForm.name);
            formData.append('address', editForm.address);
            formData.append('price', editForm.price);
            if (editForm.image) {
                formData.append('image', editForm.image);
            }

            await api.put(`/business/${business.id}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setShowEditBusiness(false);
            window.location.reload();
        } catch (err) {
            alert(err.response?.data?.message || 'Error updating profile');
        } finally {
            setActionLoading(false);
        }
    };

    const openEditModal = () => {
        setEditForm({
            name: business.name,
            address: business.address,
            price: business.pricePerHour,
            image: null
        });
        setShowEditBusiness(true);
    };

    const handleAddSlots = async (e) => {
        e.preventDefault();
        if (!business) return;
        setActionLoading(true);
        try {
            const slotNumbers = [];
            for (let i = 1; i <= slotForm.count; i++) {
                slotNumbers.push(`${slotForm.prefix}${i}`);
            }

            await api.post('/slots', { businessId: business.id, slotNumbers });
            setShowAddSlots(false);
            window.location.reload();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to add slots');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteSlot = async (slotId) => {
        if (!window.confirm('Are you sure you want to remove this parking slot? This action cannot be undone.')) return;

        try {
            await api.delete(`/slots/${slotId}`);
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to remove slot');
        }
    };

    if (loading) return (
        <div className="flex min-h-screen items-center justify-center bg-surface">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-pulse/30 border-t-pulse" />
        </div>
    );

    const SidebarItem = ({ icon: Icon, label, id }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`flex w-full items-center gap-4 rounded-2xl px-6 py-4 transition-colors ${
                activeTab === id ? 'bg-ignition text-white' : 'text-ink-soft hover:bg-surface hover:text-ink'
            }`}
        >
            <Icon size={20} aria-hidden="true" />
            <span className="text-xs font-medium uppercase tracking-[0.18em]">{label}</span>
        </button>
    );

    return (
        <div className="relative flex min-h-screen bg-surface">

            <AnimatePresence>
                {showBusinessSetup && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-asphalt/60 p-6 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="w-full max-w-xl rounded-card-lg bg-white p-10 sm:p-12"
                        >
                            <Badge variant="ignition" className="mb-6">Action required</Badge>
                            <h2 className="font-outfit text-3xl font-medium tracking-tight text-ink">Set up your parking location</h2>
                            <p className="mt-3 text-sm text-ink-soft">
                                Before you can access the dashboard, tell us about your facility.
                            </p>

                            <form onSubmit={handleRegisterBusiness} className="mt-8 space-y-6">
                                <Input
                                    label="Facility name"
                                    name="name"
                                    required
                                    value={bizForm.name}
                                    onChange={(e) => setBizForm({...bizForm, name: e.target.value})}
                                    placeholder="Alpha Parking Center"
                                />
                                <Input
                                    label="Street address"
                                    name="address"
                                    required
                                    value={bizForm.address}
                                    onChange={(e) => setBizForm({...bizForm, address: e.target.value})}
                                    placeholder="123 Tech Blvd, Silicon City"
                                />
                                <div className="grid grid-cols-2 gap-6">
                                    <Input
                                        label="Total slots"
                                        name="totalSlots"
                                        type="number"
                                        required
                                        value={bizForm.totalSlots}
                                        onChange={(e) => setBizForm({...bizForm, totalSlots: parseInt(e.target.value)})}
                                    />
                                    <Input
                                        label="Hourly rate ($)"
                                        name="price"
                                        type="number"
                                        required
                                        value={bizForm.price}
                                        onChange={(e) => setBizForm({...bizForm, price: parseFloat(e.target.value)})}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="block px-1 text-xs font-medium uppercase tracking-[0.18em] text-ink-soft">Photo</label>
                                    <div className="relative flex h-32 w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-hairline hover:border-ignition">
                                        {bizForm.image ? (
                                            <img src={URL.createObjectURL(bizForm.image)} className="h-full w-full object-cover" alt="Preview" />
                                        ) : (
                                            <>
                                                <Plus className="mb-2 text-ink-soft" size={22} aria-hidden="true" />
                                                <span className="text-xs text-ink-soft">Select a facility photo</span>
                                            </>
                                        )}
                                        <input
                                            type="file"
                                            className="absolute inset-0 cursor-pointer opacity-0"
                                            onChange={(e) => setBizForm({...bizForm, image: e.target.files[0]})}
                                            accept="image/*"
                                        />
                                    </div>
                                </div>

                                <Button type="submit" disabled={actionLoading} className="w-full">
                                    {actionLoading ? 'Saving…' : 'Create location'}
                                </Button>
                            </form>
                        </motion.div>
                    </div>
                )}

                {showAddSlots && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-asphalt/60 p-6 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="relative w-full max-w-md rounded-card-lg bg-white p-10"
                        >
                            <button
                                onClick={() => setShowAddSlots(false)}
                                className="absolute right-8 top-8 text-ink-soft hover:text-ink"
                                aria-label="Close"
                            >
                                <X size={22} aria-hidden="true" />
                            </button>
                            <Badge variant="ignition" className="mb-6">Scale your facility</Badge>
                            <h2 className="font-outfit text-2xl font-medium tracking-tight text-ink">Add new slots</h2>
                            <p className="mt-2 text-sm text-ink-soft">Generate a sequence of parking slot numbers.</p>

                            <form onSubmit={handleAddSlots} className="mt-8 space-y-6">
                                <Input
                                    label="Slot prefix"
                                    name="prefix"
                                    required
                                    value={slotForm.prefix}
                                    onChange={(e) => setSlotForm({...slotForm, prefix: e.target.value.toUpperCase()})}
                                    placeholder="A"
                                    maxLength={3}
                                />
                                <Input
                                    label="Number of slots"
                                    name="count"
                                    type="number"
                                    required
                                    min="1"
                                    max="50"
                                    value={slotForm.count}
                                    onChange={(e) => setSlotForm({...slotForm, count: parseInt(e.target.value)})}
                                />
                                <div className="rounded-card border border-hairline bg-surface p-4">
                                    <p className="text-xs uppercase tracking-widest text-ink-soft">Preview</p>
                                    <p className="mt-1 truncate font-outfit text-base text-ink">
                                        {slotForm.prefix}1, {slotForm.prefix}2 … {slotForm.prefix}{slotForm.count}
                                    </p>
                                </div>
                                <Button type="submit" disabled={actionLoading} className="w-full">
                                    {actionLoading ? 'Adding…' : 'Add slots'}
                                </Button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showEditBusiness && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-asphalt/60 p-6 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="relative w-full max-w-xl rounded-card-lg bg-white p-10"
                        >
                            <button onClick={() => setShowEditBusiness(false)} className="absolute right-8 top-8 text-ink-soft hover:text-ink" aria-label="Close">
                                <X size={22} aria-hidden="true" />
                            </button>

                            <div className="mb-6 grid h-14 w-14 place-items-center rounded-card bg-surface">
                                <Settings className="text-ignition" size={26} aria-hidden="true" />
                            </div>
                            <h2 className="font-outfit text-3xl font-medium tracking-tight text-ink">Manage profile</h2>
                            <p className="mt-2 text-sm text-ink-soft">Update your display info and parking rates</p>

                            <form onSubmit={handleUpdateBusiness} className="mt-8 space-y-6">
                                <Input
                                    label="Business name"
                                    name="name"
                                    required
                                    value={editForm.name}
                                    onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                                />
                                <Input
                                    label="Street address"
                                    name="address"
                                    required
                                    value={editForm.address}
                                    onChange={(e) => setEditForm({...editForm, address: e.target.value})}
                                />
                                <Input
                                    label="Hourly rate ($)"
                                    name="price"
                                    type="number"
                                    required
                                    value={editForm.price}
                                    onChange={(e) => setEditForm({...editForm, price: parseFloat(e.target.value)})}
                                />

                                <div className="space-y-2">
                                    <label className="block px-1 text-xs font-medium uppercase tracking-[0.18em] text-ink-soft">Photo</label>
                                    <div className="relative flex h-32 w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-hairline hover:border-ignition">
                                        {editForm.image ? (
                                            <img src={URL.createObjectURL(editForm.image)} className="h-full w-full object-cover" alt="Preview" />
                                        ) : business?.imageUrl ? (
                                            <img src={business.imageUrl} className="h-full w-full object-cover opacity-70" alt="Current" />
                                        ) : (
                                            <>
                                                <Plus className="mb-2 text-ink-soft" size={22} aria-hidden="true" />
                                                <span className="text-xs text-ink-soft">Replace current image</span>
                                            </>
                                        )}
                                        <input
                                            type="file"
                                            className="absolute inset-0 cursor-pointer opacity-0"
                                            onChange={(e) => setEditForm({...editForm, image: e.target.files[0]})}
                                            accept="image/*"
                                        />
                                    </div>
                                </div>

                                <Button type="submit" disabled={actionLoading} className="w-full">
                                    {actionLoading ? 'Saving…' : 'Save changes'}
                                </Button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <aside className="sticky top-0 flex h-screen w-72 flex-col justify-between border-r border-hairline bg-white p-8">
                <div className="space-y-10">
                    <div className="flex items-center gap-3">
                        <div className="grid h-10 w-10 place-items-center rounded-card bg-ignition text-white">
                            <Car size={22} aria-hidden="true" />
                        </div>
                        <span className="font-outfit text-lg font-medium tracking-tight text-ink">ParkEase</span>
                    </div>

                    <div className="space-y-2">
                        <SidebarItem icon={LayoutDashboard} label="Overview" id="overview" />
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="rounded-card border border-hairline bg-surface p-5">
                        <div className="flex items-center gap-3">
                            <span className="h-2 w-2 rounded-full bg-emerald-500" />
                            <span className="text-xs font-medium uppercase tracking-wide text-ink-soft">System online</span>
                        </div>
                    </div>
                    <button onClick={logout} className="flex w-full items-center gap-3 px-2 py-3 text-ink-soft hover:text-red-500">
                        <LogOut size={18} aria-hidden="true" />
                        <span className="text-xs font-medium uppercase tracking-wide">Log out</span>
                    </button>
                </div>
            </aside>

            <main className="z-0 flex-1 overflow-y-auto p-10">
                <header className="mb-12 flex items-center justify-between">
                    <div>
                        <h1 className="font-outfit text-3xl font-medium tracking-tight text-ink">Management console</h1>
                        <p className="mt-1 text-sm text-ink-soft">Business ID: {business?.id || 'Pending'}</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="grid h-11 w-11 place-items-center rounded-card border border-hairline bg-white text-ink-soft hover:text-ignition">
                            <Bell size={18} aria-hidden="true" />
                        </button>
                        <Button variant="secondary" size="md" onClick={openEditModal}>
                            <Settings size={16} className="mr-2" aria-hidden="true" />
                            Manage profile
                        </Button>
                        <Button size="md" onClick={() => setShowAddSlots(true)}>
                            <Plus size={16} className="mr-2" aria-hidden="true" />
                            Add slots
                        </Button>
                    </div>
                </header>

                <div className="mb-10 grid grid-cols-1 gap-6 md:grid-cols-3">
                    <StatCard label="Total slots" value={stats.totalSlots} icon={Activity} />
                    <StatCard label="Active sessions" value={stats.activeBookings} icon={Activity} />
                    <StatCard label="Total earnings" value={`$${stats.totalRevenue.toFixed(2)}`} icon={ShieldCheck} tone="dark" />
                </div>

                <div className="overflow-hidden rounded-card-lg border border-hairline bg-white">
                    <div className="flex items-center justify-between border-b border-hairline p-6">
                        <div>
                            <h3 className="font-outfit text-xl font-medium tracking-tight text-ink">Slot management</h3>
                            <p className="mt-1 text-xs text-ink-soft">Live availability tracking</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" aria-hidden="true" />
                                <input placeholder="Search slot #…" className="rounded-pill border border-hairline bg-surface py-2.5 pl-10 pr-5 text-xs text-ink focus:border-ignition focus:outline-none" />
                            </div>
                            <Button variant="secondary" size="sm">Export data</Button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-surface">
                                <tr>
                                    <th className="px-8 py-4 text-xs font-medium uppercase tracking-wide text-ink-soft">Slot #</th>
                                    <th className="px-8 py-4 text-xs font-medium uppercase tracking-wide text-ink-soft">Type</th>
                                    <th className="px-8 py-4 text-xs font-medium uppercase tracking-wide text-ink-soft">Status</th>
                                    <th className="px-8 py-4 text-xs font-medium uppercase tracking-wide text-ink-soft">Active booking</th>
                                    <th className="px-8 py-4 text-right text-xs font-medium uppercase tracking-wide text-ink-soft">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-hairline">
                                {slots.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-8 py-20 text-center">
                                            <Car size={28} className="mx-auto mb-4 text-ghost" aria-hidden="true" />
                                            <p className="text-sm text-ink-soft">No slots added yet. Click Add Slots.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    slots.map((slot) => (
                                        <tr key={slot.id} className="hover:bg-surface/60">
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="grid h-10 w-10 place-items-center rounded-2xl bg-surface">
                                                        <Car size={16} className="text-ink-soft" aria-hidden="true" />
                                                    </div>
                                                    <span className="font-outfit text-sm font-medium text-ink">#{slot.slotNumber}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <Badge variant="slate">Standard</Badge>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-2">
                                                    <span className={`h-2 w-2 rounded-full ${slot.status === 'available' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                                    <span className={`text-xs font-medium uppercase tracking-wide ${slot.status === 'available' ? 'text-emerald-600' : 'text-red-500'}`}>
                                                        {slot.status === 'available' ? 'Available' : 'Occupied'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                {(() => {
                                                    const active = bookings.find(b => b.slotId === slot.id && (b.status === 'booked' || b.status === 'overdue'));
                                                    if (!active) return <span className="text-sm text-ink-soft">—</span>;
                                                    const sTime = new Date(active.startTime);
                                                    const eTime = new Date(active.endTime);
                                                    const durationMs = eTime - sTime;
                                                    const durationMins = Math.round(durationMs / 60000);
                                                    const durationLabel = durationMins >= 60
                                                        ? `${(durationMins / 60).toFixed(durationMins % 60 === 0 ? 0 : 1)} hr${durationMins >= 120 ? 's' : ''}`
                                                        : `${durationMins} min${durationMins !== 1 ? 's' : ''}`;
                                                    return (
                                                        <div className="flex flex-col">
                                                            <span className="text-sm text-ink">
                                                                {sTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} – {eTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                            </span>
                                                            <span className="mt-1 text-xs text-ignition">{active.status === 'overdue' ? 'Overdue' : `Booked for ${durationLabel}`}</span>
                                                        </div>
                                                    );
                                                })()}
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleDeleteSlot(slot.id)}
                                                        disabled={slot.status !== 'available'}
                                                        className={`p-2 ${slot.status === 'available' ? 'text-ink-soft hover:text-red-500' : 'cursor-not-allowed text-ghost'}`}
                                                        title={slot.status === 'available' ? 'Delete slot' : 'Cannot delete an occupied slot'}
                                                    >
                                                        <Trash2 size={16} aria-hidden="true" />
                                                    </button>
                                                    <button className="p-2 text-ink-soft hover:text-ignition">
                                                        <MoreHorizontal size={18} aria-hidden="true" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default BusinessDashboard;
