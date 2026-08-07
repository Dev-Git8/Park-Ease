import React from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { Check, ArrowRight } from 'lucide-react';
import Button from '../../components/ui/Button';

const BookingSuccess = () => {
    const { state } = useLocation();
    const booking = state?.booking;

    return (
        <div className="flex min-h-screen items-center justify-center bg-surface p-6">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md"
            >
                <div className="rounded-card-lg border border-hairline bg-white p-12 text-center">
                    <div className="relative mb-10 flex justify-center">
                        <motion.div
                            initial={{ scale: 0, rotate: -45 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.2 }}
                            className="relative z-10 grid h-24 w-24 place-items-center rounded-card bg-navy"
                        >
                            <Check className="h-12 w-12 text-white" strokeWidth={3} aria-hidden="true" />
                        </motion.div>
                    </div>

                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="space-y-4">
                        <h1 className="font-outfit text-4xl font-medium tracking-tight text-ink">You&apos;re booked</h1>
                        <p className="text-sm text-ink-soft">Your reservation is confirmed</p>

                        <div className="rounded-card border border-hairline bg-surface p-6">
                            {booking ? (
                                <div className="space-y-1">
                                    <p className="text-sm text-ink-soft">
                                        Booking #{booking.id}{booking.business?.name ? ` · ${booking.business.name}` : ''}
                                        {booking.slot?.slotNumber ? ` · Slot ${booking.slot.slotNumber}` : ''}
                                    </p>
                                    <p className="text-sm text-ink-soft">
                                        {new Date(booking.startTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                                        {' – '}
                                        {new Date(booking.endTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                                    </p>
                                </div>
                            ) : (
                                <p className="text-sm text-ink-soft">
                                    Your spot is reserved and ready. You can review the details any time from your account.
                                </p>
                            )}
                        </div>

                        <div className="grid grid-cols-1 gap-3 pt-2">
                            <Link to="/profile">
                                <Button className="w-full" size="lg">
                                    <span>View my bookings</span>
                                    <ArrowRight className="ml-3 h-4 w-4" aria-hidden="true" />
                                </Button>
                            </Link>
                            <Link to="/">
                                <Button variant="ghost" className="w-full">Back to home</Button>
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </motion.div>
        </div>
    );
};

export default BookingSuccess;
