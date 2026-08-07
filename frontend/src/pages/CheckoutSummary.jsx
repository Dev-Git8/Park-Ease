import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Receipt, AlertTriangle, CheckCircle, ArrowRight, Home } from 'lucide-react';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { useAuth } from '../context/AuthContext';
import usePayment from '../hooks/usePayment';

const CheckoutSummary = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { pay, isProcessing, error: paymentError } = usePayment();
    const { booking, order } = location.state || {};
    const [settled, setSettled] = useState(!order);

    if (!booking) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-surface">
                <div className="text-center">
                    <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-amber-500" aria-hidden="true" />
                    <h2 className="font-outfit text-2xl font-medium text-ink">No booking data found</h2>
                    <Button onClick={() => navigate('/profile')} className="mt-6">Return to profile</Button>
                </div>
            </div>
        );
    }

    const {
        id,
        startTime,
        endTime,
        actualEndTime,
        totalPrice,
        penaltyAmount,
        business
    } = booking;

    const basePrice = parseFloat(totalPrice);
    const penalty = parseFloat(penaltyAmount || 0);
    const finalTotal = basePrice + penalty;

    const scheduledEnd = new Date(endTime);
    const actualEnd = new Date(actualEndTime || new Date());
    const isOverdue = actualEnd > scheduledEnd;

    const handlePay = async () => {
        const ok = await pay(order, {
            description: `Overstay penalty at ${business?.name || 'ParkEase'}`,
            prefill: { name: user?.name, email: user?.email },
        });
        if (ok) setSettled(true);
    };

    return (
        <div className="min-h-screen bg-surface px-6 py-20">
            <div className="mx-auto max-w-3xl">
                <AnimatePresence mode="wait">
                    {!settled ? (
                        <motion.div
                            key="billing"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="overflow-hidden rounded-card-lg border border-hairline bg-white"
                        >
                            <div className="relative bg-navy-deep p-8 text-white">
                                <Receipt className="absolute right-8 top-8 h-16 w-16 text-white/10" aria-hidden="true" />
                                <Badge variant="navy" className="mb-4">Parking receipt</Badge>
                                <h1 className="font-outfit text-3xl font-medium tracking-tight sm:text-4xl">Booking summary</h1>
                                <p className="mt-2 text-sm text-white/60">Booking #{id} · {business?.name}</p>
                            </div>

                            <div className="space-y-10 p-8 sm:p-12">
                                <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-xs uppercase tracking-widest text-ink-soft">Entry time</p>
                                            <p className="mt-1 font-outfit text-lg text-ink">
                                                {new Date(startTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs uppercase tracking-widest text-ink-soft">Scheduled exit</p>
                                            <p className="mt-1 font-outfit text-lg text-ink">
                                                {new Date(endTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-xs uppercase tracking-widest text-ink-soft">Actual exit</p>
                                            <p className="mt-1 font-outfit text-lg text-emerald-600">
                                                {new Date(actualEndTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                                            </p>
                                        </div>
                                        {isOverdue && (
                                            <div className="flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 p-4">
                                                <AlertTriangle size={18} className="mt-0.5 flex-shrink-0 text-red-500" aria-hidden="true" />
                                                <div>
                                                    <p className="text-sm font-medium text-red-600">Overstay detected</p>
                                                    <p className="text-xs text-red-500/80">A penalty has been applied to this booking.</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-4 border-t border-dashed border-hairline pt-8">
                                    <div className="flex items-center justify-between text-sm text-ink-soft">
                                        <span>Base parking fee</span>
                                        <span className="font-outfit text-lg text-ink">${basePrice.toFixed(2)}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-red-500">Overstay penalty</span>
                                        <span className="font-outfit text-lg text-red-500">${penalty.toFixed(2)}</span>
                                    </div>
                                    <div className="mt-6 flex items-end justify-between rounded-card bg-surface p-6">
                                        <div>
                                            <p className="text-xs uppercase tracking-widest text-ink-soft">Total due</p>
                                            <p className="font-outfit text-3xl text-ink">${finalTotal.toFixed(2)}</p>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    {paymentError && (
                                        <p className="mb-4 text-center text-sm text-red-500">{paymentError}</p>
                                    )}
                                    <Button className="w-full" size="lg" onClick={handlePay} disabled={isProcessing || !order}>
                                        {isProcessing ? (
                                            <span className="flex items-center justify-center gap-3">
                                                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                                                Processing payment…
                                            </span>
                                        ) : (
                                            <span className="flex items-center justify-center gap-2">
                                                Pay penalty <ArrowRight size={18} aria-hidden="true" />
                                            </span>
                                        )}
                                    </Button>
                                    <p className="mt-4 text-center text-xs text-ink-soft">Secure transaction managed by Razorpay</p>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="rounded-card-lg border border-hairline bg-white p-16 text-center"
                        >
                            <div className="mx-auto mb-8 grid h-20 w-20 place-items-center rounded-card bg-emerald-500">
                                <CheckCircle size={40} className="text-white" aria-hidden="true" />
                            </div>
                            <Badge variant="success" className="mb-6">{order ? 'Payment received' : 'Nothing owed'}</Badge>
                            <h2 className="font-outfit text-4xl font-medium tracking-tight text-ink">Thank you</h2>
                            <p className="mx-auto mt-4 max-w-sm text-sm text-ink-soft">
                                {order
                                    ? 'Your overstay penalty has been paid. The parking spot has been released for the next driver.'
                                    : "You're all settled - no charges were owed for this booking."}
                            </p>

                            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                                <Button variant="secondary" onClick={() => navigate('/')} className="w-full sm:w-auto">
                                    <Home className="mr-2" size={18} aria-hidden="true" /> Back to home
                                </Button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default CheckoutSummary;
