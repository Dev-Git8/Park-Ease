import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/api';
import { useSocket } from '../../context/SocketContext';
import { MapPin, Star, Clock, ShieldCheck, Car, ArrowLeft, CheckCircle2, Info, XCircle } from 'lucide-react';
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
    
    // Booking Configuration States
    const [duration, setDuration] = useState(60); // Duration in minutes
    const [arrivalTime, setArrivalTime] = useState('');

    // Extracted fetching slots to reuse in sockets
    const fetchSlots = async () => {
        try {
            const slotsRes = await api.get(`/slots/${id}`);
            setSlots(slotsRes.data.data);
            
            // Re-validate selected slot (clear if it became unavailable)
            setSelectedSlot(prev => {
                const refreshed = slotsRes.data.data.find(s => s.id === prev?.id);
                return refreshed?.isAvailable ? refreshed : null;
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
                
                // Pre-fill Arrival Time to Now (local ISO format stripped to minutes)
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
        
        // Join the business room
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

    const handleBooking = async () => {
        if (!selectedSlot || !arrivalTime) return alert("Please ensure an Arrival Time and Node are selected.");
        setBookingLoading(true);
        try {
            const startStr = new Date(arrivalTime);
            const startTime = startStr.toISOString();
            
            // Generate ending boundary (duration is in minutes)
            const endStr = new Date(startStr);
            endStr.setMinutes(endStr.getMinutes() + parseInt(duration));
            const endTime = endStr.toISOString();
            
            const totalPrice = (business.pricePerHour / 60) * parseInt(duration);

            await api.post('/bookings', {
                businessId: business.id,
                slotId: selectedSlot.id,
                startTime,
                endTime,
                totalPrice: parseFloat(totalPrice.toFixed(2))
            });
            navigate('/profile'); // Better UX to go straight to their history after booking!
        } catch (error) {
            alert(error.response?.data?.message || 'Booking failed');
        } finally {
            setBookingLoading(false);
        }
    };

    if (loading || !business) return (
        <div className="min-h-screen flex items-center justify-center bg-brand-light-bg dark:bg-brand-dark transition-colors duration-300">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-yellow"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-brand-light-bg dark:bg-brand-dark transition-colors duration-300 pb-20">
            {/* Header / Banner */}
            <div className="relative h-96 w-full bg-slate-900 overflow-hidden">
                <div className="absolute inset-0 opacity-40 bg-[url('https://images.unsplash.com/photo-1506521781263-d8422e82f27a?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80')] bg-cover bg-center"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-brand-light-bg dark:from-brand-dark to-transparent"></div>
                
                <div className="max-w-7xl mx-auto px-6 pt-12">
                <div className="flex flex-col space-y-12">
                    {/* Featured Image Header */}
                    {business.imageUrl && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="w-full h-[30rem] rounded-[3.5rem] overflow-hidden shadow-2xl border-4 border-white dark:border-brand-dark-card"
                        >
                            <img 
                                src={business.imageUrl} 
                                alt={business.name} 
                                className="w-full h-full object-cover"
                            />
                        </motion.div>
                    )}
                    
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                    >
                        <button 
                            onClick={() => navigate(-1)}
                            className="absolute top-24 lg:top-12 left-6 w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-brand-yellow hover:text-brand-black transition-all"
                        >
                            <ArrowLeft size={24} />
                        </button>
                        <div className="flex items-center space-x-3">
                            <Badge variant="brand">Verified Location</Badge>
                            <div className="flex items-center text-brand-yellow">
                                <Star size={16} className="fill-brand-yellow mr-1" />
                                <span className="text-sm font-black">4.9 (2k+ reviews)</span>
                            </div>
                        </div>
                        <h1 className="text-5xl lg:text-7xl font-black text-brand-black dark:text-white tracking-tighter uppercase">{business.name}</h1>
                        <div className="flex items-center text-slate-500 dark:text-slate-400 font-bold">
                            <MapPin size={18} className="mr-2 text-brand-yellow" />
                            {business.address}
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>

            <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-3 gap-12 mt-12">
                {/* Main Content: Slot Grid */}
                <div className="lg:col-span-2 space-y-12">
                    <div className="bg-white dark:bg-brand-dark-card rounded-[3rem] p-10 shadow-premium border border-slate-50 dark:border-brand-dark-card">
                        <div className="flex items-center justify-between mb-10">
                            <div>
                                <h3 className="text-3xl font-black text-brand-black dark:text-white tracking-tight uppercase">Select Your Slot</h3>
                                <p className="text-slate-400 text-sm font-bold mt-2">Choose an available parking space</p>
                            </div>
                            <div className="flex space-x-4">
                                <div className="flex items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    <div className="w-3 h-3 rounded-full bg-slate-100 dark:bg-brand-dark mr-2 border border-slate-200 dark:border-white/5"></div>
                                    Free
                                </div>
                                <div className="flex items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    <div className="w-3 h-3 rounded-full bg-slate-900 dark:bg-slate-700 mr-2"></div>
                                    Occupied
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4 lg:gap-6">
                            {slots.map((slot) => (
                                <button
                                    key={slot.id}
                                    disabled={!slot.isAvailable}
                                    onClick={() => setSelectedSlot(slot)}
                                    className={`
                                        aspect-square rounded-2xl flex flex-col items-center justify-center transition-all duration-300 group relative overflow-hidden
                                        ${slot.isAvailable 
                                            ? selectedSlot?.id === slot.id 
                                                ? 'bg-brand-yellow text-brand-black scale-105 shadow-yellow ring-4 ring-brand-yellow/20' 
                                                : 'bg-slate-50 dark:bg-brand-dark text-slate-400 hover:bg-brand-yellow/10 hover:text-brand-yellow border-2 border-slate-100 dark:border-white/5'
                                            : 'bg-slate-900 border-none text-slate-600 cursor-not-allowed opacity-40'
                                        }
                                    `}
                                >
                                    <Car size={24} className={`mb-2 ${selectedSlot?.id === slot.id ? 'animate-bounce' : 'opacity-20'}`} />
                                    <span className="text-sm font-black font-outfit uppercase">{slot.slotNumber}</span>
                                    {!slot.isAvailable && (
                                         <div className="absolute top-1 right-1">
                                             <XCircle size={12} />
                                         </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Operational Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                         <div className="bg-white dark:bg-brand-dark-card p-8 rounded-[2.5rem] border border-slate-50 dark:border-brand-dark-card shadow-sm">
                             <div className="w-12 h-12 bg-slate-50 dark:bg-brand-dark rounded-xl flex items-center justify-center mb-6">
                                <Clock className="text-brand-yellow" size={24} />
                             </div>
                             <h4 className="text-lg font-black text-brand-black dark:text-white uppercase mb-2">Business Hours</h4>
                             <p className="text-sm text-slate-500 font-bold leading-relaxed">This location operates 24/7. Slots are available for booking at any time.</p>
                         </div>
                         <div className="bg-white dark:bg-brand-dark-card p-8 rounded-[2.5rem] border border-slate-50 dark:border-brand-dark-card shadow-sm">
                             <div className="w-12 h-12 bg-slate-50 dark:bg-brand-dark rounded-xl flex items-center justify-center mb-6 text-brand-yellow">
                                <ShieldCheck size={24} />
                             </div>
                             <h4 className="text-lg font-black text-brand-black dark:text-white uppercase mb-2">Secure Booking</h4>
                             <p className="text-sm text-slate-500 font-bold leading-relaxed">Payments are processed securely and monitored in real-time.</p>
                         </div>
                    </div>
                </div>

                {/* Sidebar: Checkout Logic */}
                <div className="lg:col-span-1">
                    <div className="sticky top-32 space-y-8">
                        <div className="bg-brand-black text-white p-10 rounded-[3rem] shadow-2xl relative overflow-hidden">
                            <div className="absolute -top-10 -right-10 opacity-5">
                                 <Car size={200} />
                            </div>
                            
                            <h3 className="text-2xl font-black tracking-tighter mb-8 uppercase">Booking <br /> <span className="text-brand-yellow">Summary</span></h3>
                            
                            <div className="space-y-6 mb-10 relative z-10">
                                {/* ADDED CONFIGURATION BLOCK */}
                                <div className="space-y-4 pb-6 border-b border-white/10">
                                     <div className="space-y-2">
                                        <label className="text-[10px] font-black tracking-widest uppercase text-slate-400">Arrival Time</label>
                                        <input 
                                            type="datetime-local" 
                                            value={arrivalTime}
                                            onChange={(e) => setArrivalTime(e.target.value)}
                                            className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-brand-yellow transition-colors"
                                        />
                                     </div>
                                     <div className="space-y-2">
                                        <label className="text-[10px] font-black tracking-widest uppercase text-slate-400">Stay Duration</label>
                                        <select 
                                            value={duration}
                                            onChange={(e) => setDuration(parseInt(e.target.value))}
                                            className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-brand-yellow transition-colors appearance-none"
                                        >
                                            <option value={5}>5 Minutes</option>
                                            <option value={10}>10 Minutes</option>
                                            <option value={15}>15 Minutes</option>
                                            <option value={30}>30 Minutes</option>
                                            <option value={45}>45 Minutes</option>
                                            <option value={60}>1 Hour</option>
                                            <option value={120}>2 Hours</option>
                                            <option value={240}>4 Hours</option>
                                            <option value={480}>8 Hours</option>
                                            <option value={1440}>24 Hours (Full Day)</option>
                                        </select>
                                     </div>
                                </div>
                                {/* END CONFIG BLOCK */}

                                <div className="flex justify-between items-center py-4 border-b border-white/10">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Hourly Rate</span>
                                    <span className="text-2xl font-black font-outfit">${business.pricePerHour}</span>
                                </div>
                                <div className="flex justify-between items-center py-4 border-b border-white/10">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Selected Slot</span>
                                    <span className="text-2xl font-black font-outfit text-brand-yellow">{selectedSlot ? selectedSlot.slotNumber : '---'}</span>
                                </div>
                                <div className="flex justify-between items-center pt-4">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Total Price</span>
                                    <span className="text-4xl font-black font-outfit text-white">
                                        ${selectedSlot ? ((business.pricePerHour / 60) * duration).toFixed(2) : '0.00'}
                                    </span>
                                </div>
                            </div>

                            <Button 
                                onClick={handleBooking}
                                disabled={!selectedSlot || bookingLoading}
                                size="lg" 
                                className="w-full py-6 rounded-2xl shadow-yellow disabled:bg-slate-800 disabled:text-slate-600 relative z-10"
                            >
                                {bookingLoading ? (
                                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-brand-black cursor-progress"></div>
                                ) : (
                                    <>
                                        Confirm Booking
                                        <CheckCircle2 size={18} className="ml-3" />
                                    </>
                                )}
                            </Button>
                        </div>
                        
                        <div className="bg-slate-50 dark:bg-brand-dark-card/50 p-6 rounded-3xl border border-slate-100 dark:border-white/5 flex items-start space-x-4">
                             <div className="p-2 bg-brand-yellow/10 rounded-lg">
                                 <Info className="text-brand-yellow flex-shrink-0" size={16} />
                             </div>
                             <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
                                 Booking is final. Cancellation is subject to the location&apos;s policy and space availability.
                             </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BusinessDetails;
