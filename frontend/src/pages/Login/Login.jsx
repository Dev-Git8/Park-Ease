import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Mail, Lock, ArrowRight, Car } from 'lucide-react';
import { motion } from 'framer-motion';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Reveal from '../../components/ui/Reveal';

const Login = () => {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const user = await login(formData.email, formData.password);
            if (user.role === 'admin') navigate('/admin');
            else if (user.role === 'business') navigate('/dashboard');
            else navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || "We couldn't sign you in. Check your email and password.");
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
                className="relative w-full max-w-md"
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
                    <h1 className="font-outfit text-4xl font-medium tracking-tight text-ink">Welcome back</h1>
                    <p className="mt-2 text-sm text-ink-soft">Sign in to manage your bookings</p>
                </motion.div>

                <div className="rounded-card-lg border border-hairline bg-white p-8 shadow-[0_20px_60px_-20px_rgba(15,23,42,0.15)] sm:p-10">
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="mb-6 rounded-2xl border border-red-100 bg-red-50 px-5 py-3 text-center text-sm text-red-600"
                        >
                            {error}
                        </motion.div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <Reveal delayIn={100} preset="reveal">
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
                        </Reveal>

                        <Reveal delayIn={180} preset="reveal">
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

                        <Button type="submit" disabled={loading} className="w-full" size="lg">
                            {loading ? (
                                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                            ) : (
                                <>
                                    <span>Sign in</span>
                                    <ArrowRight className="ml-3 h-4 w-4" aria-hidden="true" />
                                </>
                            )}
                        </Button>
                    </form>

                    <p className="mt-8 text-center text-sm text-ink-soft">
                        New to ParkEase?
                        <Link to="/register" className="ml-2 font-medium text-ignition hover:underline">Create an account</Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;
