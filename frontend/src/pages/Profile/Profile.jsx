import React, { useState, useEffect } from 'react';
import api from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import { User, Calendar, MapPin, Tag, Clock, ChevronRight, XCircle, ShieldCheck, History, Car, Trash2, LogOut, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { Link, useNavigate } from 'react-router-dom';

const Profile = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBookings = async () => {
            try {
                const { data } = await api.get('/bookings/my');
                setBookings(data.data);
            } catch (error) {
                console.error('Error fetching bookings', error);
            } finally {
                setLoading(false);
            }
        };
        fetchBookings();
    }, []);

    const handleCancel = async (bookingId) => {
        if (!window.confirm('Cancel this reservation? This can only be done BEFORE the start time.')) return;
        try {
            await api.put(`/bookings/${bookingId}/cancel`);
            setBookings(bookings.map(b => b.id === bookingId ? { ...b, status: 'cancelled' } : b));
        } catch (error) {
            alert(error.response?.data?.message || 'Cancellation failed');
        }
    };

    const handleCheckout = async (bookingId) => {
        try {
            const { data } = await api.put(`/bookings/${bookingId}/terminate`);
            // Redirect to summary page with the returned booking/bill data
            navigate('/checkout-summary', { state: { booking: data.data } });
        } catch (error) {
            console.error('Termination failed', error);
            alert(error.response?.data?.message || 'Checkout failed');
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'booked': return <Badge variant="success">Active Booking</Badge>;
            case 'overdue': return <Badge variant="destructive" className="animate-pulse">Overstay Warning</Badge>;
            case 'completed': return <Badge variant="brand" className="bg-emerald-500">Booking Completed</Badge>;
            case 'cancelled': return <Badge variant="slate">Cancelled</Badge>;
            default: return <Badge variant="slate">{status}</Badge>;
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-brand-light-bg dark:bg-brand-dark transition-colors duration-300">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-yellow"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-brand-light-bg dark:bg-brand-dark transition-colors duration-300 py-20 px-6">
            <div className="max-w-7xl mx-auto space-y-16">
                {/* Header and other sections remain similar but with updated rendering */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                    >
                        <Badge variant="brand" className="mb-4">User Profile</Badge>
                        <h1 className="text-5xl lg:text-6xl font-black text-brand-black dark:text-white tracking-tighter uppercase">{user?.name}</h1>
                        <p className="text-slate-500 dark:text-slate-400 font-bold mt-2 uppercase tracking-widest text-xs">{user?.email}</p>
                    </motion.div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
                     <div className="lg:col-span-1 space-y-6">
                          <div className="bg-brand-black text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                               <h3 className="text-xl font-black uppercase tracking-tighter mb-8 italic">Booking <br /> Stats</h3>
                               <div className="space-y-6">
                                    <div className="flex justify-between items-center">
                                         <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Bookings</span>
                                         <span className="text-2xl font-black font-outfit text-brand-yellow">{bookings.length}</span>
                                    </div>
                               </div>
                          </div>
                     </div>

                     <div className="lg:col-span-3 space-y-8">
                          <h2 className="text-3xl font-black text-brand-black dark:text-white tracking-tight uppercase">Booking History</h2>

                          {bookings.length === 0 ? (
                               <div className="text-center py-20">
                                   <Car className="w-16 h-16 text-slate-100 mx-auto mb-6" />
                                   <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No bookings found.</p>
                               </div>
                          ) : (
                               <div className="space-y-6">
                                    {bookings.map((booking) => (
                                         <motion.div 
                                            key={booking.id}
                                            className="group bg-white dark:bg-brand-dark-card p-4 rounded-[2.5rem] border border-slate-50 dark:border-brand-dark-card shadow-sm hover:shadow-premium-hover transition-all duration-500 flex flex-col md:flex-row md:items-center gap-8"
                                         >
                                            <div className="w-20 h-20 bg-slate-50 dark:bg-brand-dark rounded-2xl flex items-center justify-center flex-shrink-0">
                                                 <Car size={32} className="text-slate-400" />
                                            </div>
                                            
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-3 mb-2">
                                                    {getStatusBadge(booking.status)}
                                                    <span className="text-[10px] font-black font-outfit text-slate-300 uppercase tracking-widest">Booking ID: {booking.id}</span>
                                                </div>
                                                <h4 className="text-xl font-black text-brand-black dark:text-white uppercase">{booking.business?.name || 'Unknown Location'}</h4>
                                                <div className="text-xs font-bold text-slate-400 uppercase tracking-tight">
                                                    Parking Slot {booking.slot?.slotNumber || '---'} | {new Date(booking.startTime).toLocaleString()}
                                                </div>
                                            </div>

                                            <div className="flex flex-row md:flex-col items-center md:items-end gap-4">
                                                <div className="text-right">
                                                     <p className="text-2xl font-black text-brand-black dark:text-white font-outfit">${booking.totalPrice}</p>
                                                     {booking.penaltyAmount > 0 && <p className="text-[10px] text-red-500 font-black">+ ${booking.penaltyAmount} penalty</p>}
                                                </div>
                                                
                                                {(booking.status === 'booked' || booking.status === 'overdue') && (
                                                    <div className="flex space-x-2">
                                                        <button 
                                                            onClick={() => handleCheckout(booking.id)}
                                                            className="flex items-center px-4 py-2 bg-emerald-500 text-white font-black text-[10px] uppercase rounded-xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
                                                        >
                                                            <LogOut size={14} className="mr-2" /> Checkout
                                                        </button>
                                                        <button 
                                                            onClick={() => handleCancel(booking.id)}
                                                            className="p-2 bg-slate-100 dark:bg-brand-dark text-slate-400 hover:bg-red-500 hover:text-white rounded-xl transition-all"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </div>
                                                )}
                                                {booking.status === 'completed' && (
                                                    <div className="flex items-center text-emerald-500 space-x-2">
                                                        <CheckCircle2 size={16} />
                                                        <span className="text-[10px] font-black uppercase tracking-widest">Settled</span>
                                                    </div>
                                                )}
                                            </div>
                                         </motion.div>
                                    ))}
                               </div>
                          )}
                     </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
