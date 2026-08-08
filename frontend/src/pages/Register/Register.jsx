import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { User, Mail, Lock, ArrowRight, Car } from 'lucide-react';
import { motion } from 'framer-motion';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

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
        <div className="flex flex-1 items-center justify-center bg-surface p-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-2xl"
            >
                <div className="mb-10 text-center">
                    <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-card bg-ignition">
                        <Car className="h-8 w-8 text-white" aria-hidden="true" />
                    </div>
                    <h1 className="font-outfit text-4xl font-medium tracking-tight text-ink">Create your account</h1>
                    <p className="mt-2 text-sm text-ink-soft">Join ParkEase to book or list parking</p>
                </div>

                <div className="rounded-card-lg border border-hairline bg-white p-8 shadow-sm sm:p-12">
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

                        <div className="space-y-3">
                            <label className="block px-1 text-xs font-medium uppercase tracking-[0.18em] text-ink-soft">
                                I&apos;m signing up as a
                            </label>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, role: 'customer' })}
                                    className={`flex flex-col items-center gap-2 rounded-2xl border py-5 transition-colors ${
                                        formData.role === 'customer'
                                            ? 'border-ignition bg-ignition text-white'
                                            : 'border-hairline bg-surface text-ink-soft hover:border-ignition'
                                    }`}
                                >
                                    <User className="h-5 w-5" aria-hidden="true" />
                                    <span className="text-xs font-medium uppercase tracking-wide">Driver</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, role: 'business' })}
                                    className={`flex flex-col items-center gap-2 rounded-2xl border py-5 transition-colors ${
                                        formData.role === 'business'
                                            ? 'border-ignition bg-ignition text-white'
                                            : 'border-hairline bg-surface text-ink-soft hover:border-ignition'
                                    }`}
                                >
                                    <Car className="h-5 w-5" aria-hidden="true" />
                                    <span className="text-xs font-medium uppercase tracking-wide">Lot owner</span>
                                </button>
                            </div>
                        </div>

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
