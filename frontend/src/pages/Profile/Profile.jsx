import React, { useState, useEffect } from 'react';
import api from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import usePayment from '../../hooks/usePayment';
import { Calendar, MapPin, Car, Trash2, LogOut, CheckCircle2, CreditCard, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import Badge from '../../components/ui/Badge';
import StatCard from '../../components/ui/StatCard';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const { pay, isProcessing } = usePayment();

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
        if (!window.confirm('Cancel this reservation? This can only be done before the start time.')) return;
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
            navigate('/checkout-summary', { state: { booking: data.data.booking, order: data.data.order } });
        } catch (error) {
            console.error('Termination failed', error);
            alert(error.response?.data?.message || 'Checkout failed');
        }
    };

    const buildResumeOrder = (payment, keyId) => ({
        orderId: payment.providerOrderId,
        amount: Math.round(parseFloat(payment.amount) * 100),
        currency: 'INR',
        keyId,
    });

    // Resumes an abandoned initial booking payment - pays inline, right
    // here on Profile, since there's nothing else to show beyond "pay to
    // confirm this booking".
    const handleResumeBookingPayment = async (booking) => {
        const payment = booking.payments?.[0];
        if (!payment) return;
        try {
            const { data } = await api.get('/payments/config');
            const order = buildResumeOrder(payment, data.data.keyId);
            const ok = await pay(order, {
                description: `Parking at ${booking.business?.name || 'ParkEase'}`,
                prefill: { name: user?.name, email: user?.email },
            });
            if (ok) {
                setBookings(prev => prev.map(b => b.id === booking.id ? { ...b, status: 'booked' } : b));
            }
        } catch (error) {
            alert(error.response?.data?.message || 'Could not resume payment');
        }
    };

    // Resumes an abandoned overstay-penalty payment - routes through the
    // checkout-summary receipt screen, same as a fresh checkout would.
    const handleResumePenaltyPayment = async (booking) => {
        const payment = booking.payments?.[0];
        try {
            const { data } = await api.get('/payments/config');
            const order = payment ? buildResumeOrder(payment, data.data.keyId) : null;
            navigate('/checkout-summary', { state: { booking, order } });
        } catch (error) {
            alert(error.response?.data?.message || 'Could not resume payment');
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'booked': return <Badge variant="success">Active booking</Badge>;
            case 'overdue': return <Badge variant="danger" className="animate-pulse">Overstay</Badge>;
            case 'completed': return <Badge variant="success">Completed</Badge>;
            case 'cancelled': return <Badge variant="slate">Cancelled</Badge>;
            case 'pending_payment': return <Badge variant="warning" className="animate-pulse">Awaiting payment</Badge>;
            case 'pending_penalty_payment': return <Badge variant="danger" className="animate-pulse">Payment due</Badge>;
            case 'expired': return <Badge variant="slate">Payment expired</Badge>;
            default: return <Badge variant="slate">{status}</Badge>;
        }
    };

    if (loading) return (
        <div className="flex min-h-screen items-center justify-center bg-surface">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-navy/30 border-t-navy" />
        </div>
    );

    return (
        <div className="min-h-screen bg-surface px-6 py-16">
            <div className="mx-auto max-w-6xl space-y-12">
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                    <p className="text-xs font-medium uppercase tracking-[0.22em] text-ink-soft">Your account</p>
                    <h1 className="mt-2 font-outfit text-4xl font-medium tracking-tight text-ink sm:text-5xl">{user?.name}</h1>
                    <p className="mt-2 text-sm text-ink-soft">{user?.email}</p>
                </motion.div>

                <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
                    <div className="lg:col-span-1">
                        <StatCard label="Total bookings" value={bookings.length} icon={Calendar} tone="dark" />
                    </div>

                    <div className="space-y-6 lg:col-span-3">
                        <h2 className="font-outfit text-2xl font-medium tracking-tight text-ink">Booking history</h2>

                        {bookings.length === 0 ? (
                            <div className="rounded-card border border-hairline bg-white py-16 text-center">
                                <Car className="mx-auto mb-4 h-10 w-10 text-ghost" aria-hidden="true" />
                                <p className="text-sm text-ink-soft">No bookings yet.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {bookings.map((booking) => (
                                    <motion.div
                                        key={booking.id}
                                        className="flex flex-col gap-6 rounded-card border border-hairline bg-white p-6 md:flex-row md:items-center"
                                    >
                                        <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-surface">
                                            <Car size={28} className="text-ink-soft" aria-hidden="true" />
                                        </div>

                                        <div className="flex-1">
                                            <div className="mb-2 flex items-center gap-3">
                                                {getStatusBadge(booking.status)}
                                                <span className="text-xs text-ink-soft">Booking #{booking.id}</span>
                                            </div>
                                            <h4 className="font-outfit text-lg font-medium text-ink">{booking.business?.name || 'Unknown location'}</h4>
                                            <p className="flex items-center gap-2 text-sm text-ink-soft">
                                                <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                                                Slot {booking.slot?.slotNumber || '—'} · {new Date(booking.startTime).toLocaleString()}
                                            </p>
                                        </div>

                                        <div className="flex flex-row items-center gap-4 md:flex-col md:items-end">
                                            <div className="text-right">
                                                <p className="font-outfit text-xl font-medium text-ink">${booking.totalPrice}</p>
                                                {booking.penaltyAmount > 0 && <p className="text-xs text-red-500">+ ${booking.penaltyAmount} penalty</p>}
                                            </div>

                                            {(booking.status === 'booked' || booking.status === 'overdue') && (
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleCheckout(booking.id)}
                                                        className="flex items-center gap-2 rounded-pill bg-navy px-4 py-2 text-xs font-medium uppercase tracking-wide text-white hover:bg-navy-deep"
                                                    >
                                                        <LogOut size={14} aria-hidden="true" /> Check out
                                                    </button>
                                                    <button
                                                        onClick={() => handleCancel(booking.id)}
                                                        className="rounded-pill bg-surface p-2 text-ink-soft hover:bg-red-500 hover:text-white"
                                                        aria-label="Cancel booking"
                                                    >
                                                        <Trash2 size={16} aria-hidden="true" />
                                                    </button>
                                                </div>
                                            )}
                                            {booking.status === 'pending_payment' && (
                                                <button
                                                    onClick={() => handleResumeBookingPayment(booking)}
                                                    disabled={isProcessing}
                                                    className="flex items-center gap-2 rounded-pill bg-navy px-4 py-2 text-xs font-medium uppercase tracking-wide text-white hover:bg-navy-deep disabled:opacity-50"
                                                >
                                                    <CreditCard size={14} aria-hidden="true" /> Complete payment
                                                </button>
                                            )}
                                            {booking.status === 'pending_penalty_payment' && (
                                                <button
                                                    onClick={() => handleResumePenaltyPayment(booking)}
                                                    className="flex items-center gap-2 rounded-pill bg-red-500 px-4 py-2 text-xs font-medium uppercase tracking-wide text-white hover:bg-red-600"
                                                >
                                                    <AlertCircle size={14} aria-hidden="true" /> Pay penalty
                                                </button>
                                            )}
                                            {booking.status === 'completed' && (
                                                <div className="flex items-center gap-2 text-emerald-600">
                                                    <CheckCircle2 size={16} aria-hidden="true" />
                                                    <span className="text-xs font-medium uppercase tracking-wide">Settled</span>
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
