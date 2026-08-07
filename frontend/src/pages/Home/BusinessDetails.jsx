import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/api';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import usePayment from '../../hooks/usePayment';
import { MapPin, Clock, ShieldCheck, Car, ArrowLeft, CheckCircle2, Info, XCircle, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';

const BusinessDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [business, setBusiness] = useState(null);
    const [slots, setSlots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [bookingLoading, setBookingLoading] = useState(false);
    const socket = useSocket();

    const [duration, setDuration] = useState(60);
    const [arrivalTime, setArrivalTime] = useState('');
    const [pendingPayment, setPendingPayment] = useState(null); // { booking, order } while awaiting payment
    const { user } = useAuth();
    const { pay, isProcessing, error: paymentError } = usePayment();

    const fetchSlots = async () => {
        try {
            const slotsRes = await api.get(`/slots/${id}`);
            setSlots(slotsRes.data.data);

            setSelectedSlot(prev => {
                const refreshed = slotsRes.data.data.find(s => s.id === prev?.id);
                return refreshed?.status === 'available' ? refreshed : null;
            });
        } catch (error) {
            console.error('Error fetching slots', error);
        }
    };

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const bizRes = await api.get(`/business/${id}`);
                setBusiness(bizRes.data.data);

                await fetchSlots();

                const now = new Date();
                const offset = now.getTimezoneOffset() * 60000;
                const localISOTime = (new Date(now - offset)).toISOString().slice(0, 16);
                setArrivalTime(localISOTime);

            } catch (error) {
                console.error('Error fetching details', error);
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [id]);

    useEffect(() => {
        if (!socket) return;

        socket.emit('joinBusinessRoom', id);

        socket.on('slotsUpdated', (data) => {
            if (data.businessId.toString() === id.toString()) {
                fetchSlots();
            }
        });

        return () => {
            socket.emit('leaveBusinessRoom', id);
            socket.off('slotsUpdated');
        };
    }, [socket, id]);

    const attemptPayment = async (booking, order) => {
        const ok = await pay(order, {
            description: `Parking at ${business.name}`,
            prefill: { name: user?.name, email: user?.email },
        });

        if (ok) {
            setPendingPayment(null);
            navigate('/booking-success', {
                state: { booking: { ...booking, business: { name: business.name }, slot: { slotNumber: selectedSlot?.slotNumber } } },
            });
        } else {
            setPendingPayment({ booking, order });
        }
    };

    const handleBooking = async () => {
        if (!selectedSlot || !arrivalTime) return alert('Please choose an arrival time and a slot.');
        setBookingLoading(true);
        try {
            const startStr = new Date(arrivalTime);
            const startTime = startStr.toISOString();

            const endStr = new Date(startStr);
            endStr.setMinutes(endStr.getMinutes() + parseInt(duration));
            const endTime = endStr.toISOString();

            const { data } = await api.post('/bookings', {
                businessId: business.id,
                slotId: selectedSlot.id,
                startTime,
                endTime,
            });

            setBookingLoading(false);
            await attemptPayment(data.data.booking, data.data.order);
        } catch (error) {
            setBookingLoading(false);
            alert(error.response?.data?.message || 'Booking failed');
        }
    };

    const handleRetryPayment = () => {
        if (!pendingPayment) return;
        attemptPayment(pendingPayment.booking, pendingPayment.order);
    };

    if (loading || !business) return (
        <div className="flex min-h-screen items-center justify-center bg-surface">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-navy/30 border-t-navy" />
        </div>
    );

    return (
        <div className="min-h-screen bg-surface pb-20">
            <div className="relative h-80 w-full overflow-hidden bg-navy-deep">
                {business.imageUrl && (
                    <img src={business.imageUrl} alt={business.name} className="absolute inset-0 h-full w-full object-cover opacity-50" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-surface via-navy-deep/20 to-transparent" />
            </div>

            <div className="mx-auto max-w-6xl px-6">
                <div className="-mt-24 space-y-6">
                    <button
                        onClick={() => navigate(-1)}
                        className="grid h-11 w-11 place-items-center rounded-pill bg-white text-ink shadow-sm hover:bg-surface"
                        aria-label="Go back"
                    >
                        <ArrowLeft size={20} aria-hidden="true" />
                    </button>

                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                        <Badge variant="navy">Verified location</Badge>
                        <h1 className="font-outfit text-4xl font-medium tracking-tight text-ink sm:text-5xl">{business.name}</h1>
                        <p className="flex items-center gap-2 text-sm text-ink-soft">
                            <MapPin size={16} aria-hidden="true" />
                            {business.address}
                        </p>
                    </motion.div>
                </div>

                <div className="mt-12 grid grid-cols-1 gap-10 lg:grid-cols-3">
                    <div className="space-y-8 lg:col-span-2">
                        <div className="rounded-card-lg border border-hairline bg-white p-8">
                            <div className="mb-8 flex items-center justify-between">
                                <div>
                                    <h3 className="font-outfit text-2xl font-medium tracking-tight text-ink">Choose a slot</h3>
                                    <p className="mt-1 text-sm text-ink-soft">Pick any available space</p>
                                </div>
                                <div className="flex gap-4 text-xs text-ink-soft">
                                    <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full border border-hairline bg-surface" /> Free</span>
                                    <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-ink" /> Occupied</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-5">
                                {slots.map((slot) => {
                                    const isAvailable = slot.status === 'available';
                                    return (
                                        <button
                                            key={slot.id}
                                            disabled={!isAvailable}
                                            onClick={() => setSelectedSlot(slot)}
                                            className={`relative flex aspect-square flex-col items-center justify-center gap-2 rounded-2xl transition-colors ${
                                                isAvailable
                                                    ? selectedSlot?.id === slot.id
                                                        ? 'bg-navy text-white'
                                                        : 'border border-hairline bg-surface text-ink-soft hover:border-navy'
                                                    : 'cursor-not-allowed bg-ghost/40 text-ink-soft/50'
                                            }`}
                                        >
                                            <Car size={22} aria-hidden="true" />
                                            <span className="font-outfit text-sm font-medium uppercase">{slot.slotNumber}</span>
                                            {!isAvailable && <XCircle size={12} className="absolute right-2 top-2" aria-hidden="true" />}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div className="rounded-card border border-hairline bg-white p-6">
                                <div className="mb-4 grid h-10 w-10 place-items-center rounded-pill bg-surface">
                                    <Clock className="h-5 w-5 text-navy" aria-hidden="true" />
                                </div>
                                <h4 className="font-outfit text-lg font-medium text-ink">Open 24/7</h4>
                                <p className="mt-1 text-sm text-ink-soft">Slots are available for booking at any time.</p>
                            </div>
                            <div className="rounded-card border border-hairline bg-white p-6">
                                <div className="mb-4 grid h-10 w-10 place-items-center rounded-pill bg-surface">
                                    <ShieldCheck className="h-5 w-5 text-navy" aria-hidden="true" />
                                </div>
                                <h4 className="font-outfit text-lg font-medium text-ink">Secure booking</h4>
                                <p className="mt-1 text-sm text-ink-soft">Payments are processed securely and monitored in real time.</p>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-1">
                        <div className="sticky top-28 space-y-6">
                            <div className="rounded-card-lg bg-navy-deep p-8 text-white">
                                <h3 className="font-outfit text-xl font-medium tracking-tight">Booking summary</h3>

                                <div className="mt-6 space-y-4 border-b border-white/10 pb-6">
                                    <label className="block">
                                        <span className="text-xs uppercase tracking-widest text-white/60">Arrival time</span>
                                        <input
                                            type="datetime-local"
                                            value={arrivalTime}
                                            onChange={(e) => setArrivalTime(e.target.value)}
                                            className="mt-2 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white focus:border-navy-light focus:outline-none"
                                        />
                                    </label>
                                    <label className="block">
                                        <span className="text-xs uppercase tracking-widest text-white/60">Stay duration</span>
                                        <select
                                            value={duration}
                                            onChange={(e) => setDuration(parseInt(e.target.value))}
                                            className="mt-2 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white focus:border-navy-light focus:outline-none"
                                        >
                                            <option value={5}>5 minutes</option>
                                            <option value={10}>10 minutes</option>
                                            <option value={15}>15 minutes</option>
                                            <option value={30}>30 minutes</option>
                                            <option value={45}>45 minutes</option>
                                            <option value={60}>1 hour</option>
                                            <option value={120}>2 hours</option>
                                            <option value={240}>4 hours</option>
                                            <option value={480}>8 hours</option>
                                            <option value={1440}>24 hours</option>
                                        </select>
                                    </label>
                                </div>

                                <div className="space-y-4 py-6">
                                    <div className="flex items-center justify-between text-sm text-white/70">
                                        <span>Hourly rate</span>
                                        <span className="font-outfit text-lg text-white">${business.pricePerHour}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm text-white/70">
                                        <span>Selected slot</span>
                                        <span className="font-outfit text-lg text-white">{selectedSlot ? selectedSlot.slotNumber : '—'}</span>
                                    </div>
                                    <div className="flex items-center justify-between border-t border-white/10 pt-4 text-sm text-white/70">
                                        <span>Total</span>
                                        <span className="font-outfit text-3xl text-white">
                                            ${selectedSlot ? ((business.pricePerHour / 60) * duration).toFixed(2) : '0.00'}
                                        </span>
                                    </div>
                                </div>

                                {paymentError && (
                                    <div className="mb-4 flex items-start gap-3 rounded-2xl border border-red-400/30 bg-red-500/10 p-4">
                                        <AlertTriangle size={16} className="mt-0.5 flex-shrink-0 text-red-300" aria-hidden="true" />
                                        <p className="text-xs text-red-200">{paymentError}</p>
                                    </div>
                                )}

                                <Button
                                    onClick={pendingPayment ? handleRetryPayment : handleBooking}
                                    disabled={!selectedSlot || bookingLoading || isProcessing}
                                    variant="secondary"
                                    size="lg"
                                    className="w-full"
                                >
                                    {bookingLoading || isProcessing ? (
                                        <span className="h-5 w-5 animate-spin rounded-full border-2 border-navy/30 border-t-navy" />
                                    ) : pendingPayment ? (
                                        <>
                                            Retry payment
                                            <CheckCircle2 size={18} className="ml-3" aria-hidden="true" />
                                        </>
                                    ) : (
                                        <>
                                            Confirm booking
                                            <CheckCircle2 size={18} className="ml-3" aria-hidden="true" />
                                        </>
                                    )}
                                </Button>
                            </div>

                            <div className="flex items-start gap-3 rounded-card border border-hairline bg-white p-5">
                                <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-navy" aria-hidden="true" />
                                <p className="text-xs text-ink-soft">
                                    Booking is final. Cancellation is subject to the location&apos;s policy and space availability.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BusinessDetails;
