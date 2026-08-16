import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { User, Mail, Lock, ArrowRight, Car } from 'lucide-react';
import { motion } from 'framer-motion';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Reveal from '../../components/ui/Reveal';

const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'customer'
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { register } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await register(formData.name, formData.email, formData.password, formData.role);
            navigate('/login');
        } catch (err) {
            setError(err.response?.data?.message || "We couldn't create your account. Check your details and try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-surface p-6">
            <div
                aria-hidden="true"
                className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-ignition/10 blur-3xl"
            />
            <div
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-pulse/10 blur-3xl"
            />
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative w-full max-w-2xl"
            >
                <motion.div
                    initial={{ opacity: 0, y: 12, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: 0.1, type: 'spring', stiffness: 260, damping: 20 }}
                    className="mb-10 text-center"
                >
                    <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-card bg-ignition shadow-[0_10px_30px_-8px_rgba(255,106,43,0.55)]">
                        <Car className="h-8 w-8 text-white" aria-hidden="true" />
                    </div>
                    <h1 className="font-outfit text-4xl font-medium tracking-tight text-ink">Create your account</h1>
                    <p className="mt-2 text-sm text-ink-soft">Join ParkEase to book or list parking</p>
                </motion.div>

                <div className="rounded-card-lg border border-hairline bg-white p-8 shadow-[0_20px_60px_-20px_rgba(15,23,42,0.15)] sm:p-12">
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="mb-8 rounded-2xl border border-red-100 bg-red-50 px-5 py-3 text-center text-sm text-red-600"
                        >
                            {error}
                        </motion.div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-8">
                        <Reveal delayIn={100} preset="reveal">
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <Input
                                    label="Full name"
                                    name="name"
                                    type="text"
                                    required
                                    icon={User}
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="Jamie Fox"
                                />

                                <Input
                                    label="Email"
                                    name="email"
                                    type="email"
                                    required
                                    icon={Mail}
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="you@email.com"
                                />
                            </div>
                        </Reveal>

                        <Reveal delayIn={160} preset="reveal">
                            <Input
                                label="Password"
                                name="password"
                                type="password"
                                required
                                icon={Lock}
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="••••••••"
                            />
                        </Reveal>

                        <Reveal delayIn={220} preset="reveal">
                            <div className="space-y-3">
                                <label className="block px-1 text-xs font-medium uppercase tracking-[0.18em] text-ink-soft">
                                    I&apos;m signing up as a
                                </label>
                                <div className="grid grid-cols-2 gap-4">
                                    <motion.button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, role: 'customer' })}
                                        whileHover={{ y: -2 }}
                                        whileTap={{ scale: 0.97 }}
                                        transition={{ type: 'spring', stiffness: 320, damping: 22 }}
                                        className={`flex flex-col items-center gap-2 rounded-2xl border py-5 transition-colors ${
                                            formData.role === 'customer'
                                                ? 'border-ignition bg-ignition text-white shadow-[0_10px_25px_-10px_rgba(255,106,43,0.6)]'
                                                : 'border-hairline bg-surface text-ink-soft hover:border-ignition'
                                        }`}
                                    >
                                        <User className="h-5 w-5" aria-hidden="true" />
                                        <span className="text-xs font-medium uppercase tracking-wide">Driver</span>
                                    </motion.button>
                                    <motion.button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, role: 'business' })}
                                        whileHover={{ y: -2 }}
                                        whileTap={{ scale: 0.97 }}
                                        transition={{ type: 'spring', stiffness: 320, damping: 22 }}
                                        className={`flex flex-col items-center gap-2 rounded-2xl border py-5 transition-colors ${
                                            formData.role === 'business'
                                                ? 'border-ignition bg-ignition text-white shadow-[0_10px_25px_-10px_rgba(255,106,43,0.6)]'
                                                : 'border-hairline bg-surface text-ink-soft hover:border-ignition'
                                        }`}
                                    >
                                        <Car className="h-5 w-5" aria-hidden="true" />
                                        <span className="text-xs font-medium uppercase tracking-wide">Lot owner</span>
                                    </motion.button>
                                </div>
                            </div>
                        </Reveal>

                        <Button type="submit" disabled={loading} className="w-full" size="lg">
                            {loading ? (
                                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                            ) : (
                                <>
                                    <span>Create account</span>
                                    <ArrowRight className="ml-3 h-4 w-4" aria-hidden="true" />
                                </>
                            )}
                        </Button>
                    </form>

                    <p className="mt-10 text-center text-sm text-ink-soft">
                        Already have an account?
                        <Link to="/login" className="ml-2 font-medium text-ignition hover:underline">Sign in</Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default Register;
