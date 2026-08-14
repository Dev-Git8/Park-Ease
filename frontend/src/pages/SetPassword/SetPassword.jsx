import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Lock, Car } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../../api/api';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

const SetPassword = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token') || '';

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (password.length < 8) {
            setError('Password must be at least 8 characters.');
            return;
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setLoading(true);
        try {
            await api.post('/auth/set-password', { token, password });
            setDone(true);
        } catch (err) {
            setError(err.response?.data?.message || 'This link is invalid or has expired.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-1 items-center justify-center bg-surface p-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                <div className="mb-10 text-center">
                    <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-card bg-ignition">
                        <Car className="h-8 w-8 text-white" aria-hidden="true" />
                    </div>
                    <h1 className="font-outfit text-4xl font-medium tracking-tight text-ink">Set your password</h1>
                    <p className="mt-2 text-sm text-ink-soft">Finish setting up your new business account</p>
                </div>

                <div className="rounded-card-lg border border-hairline bg-white p-8 shadow-sm sm:p-10">
                    {done ? (
                        <div className="text-center">
                            <p className="text-sm text-ink-soft">Your password has been set.</p>
                            <Link to="/login" className="mt-6 inline-block font-medium text-ignition hover:underline">
                                Go to login
                            </Link>
                        </div>
                    ) : (
                        <>
                            {error && (
                                <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 px-5 py-3 text-center text-sm text-red-600">
                                    {error}
                                </div>
                            )}
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <Input
                                    label="New password"
                                    name="password"
                                    type="password"
                                    required
                                    icon={Lock}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                />
                                <Input
                                    label="Confirm password"
                                    name="confirmPassword"
                                    type="password"
                                    required
                                    icon={Lock}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="••••••••"
                                />
                                <Button type="submit" disabled={loading} className="w-full" size="lg">
                                    {loading ? (
                                        <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                                    ) : (
                                        <span>Set password</span>
                                    )}
                                </Button>
                            </form>
                        </>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default SetPassword;
