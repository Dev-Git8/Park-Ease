import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Zap, Users, Car, MapPin } from 'lucide-react';
import Button from '../../components/ui/Button';
import Eyebrow from '../../components/ui/Eyebrow';

const About = () => {
    return (
        <div className="min-h-screen bg-white">
            <section className="mx-auto max-w-6xl px-6 py-24 md:py-32">
                <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl">
                    <Eyebrow>Our mission</Eyebrow>
                    <h1 className="mt-4 font-outfit text-6xl font-medium tracking-tight text-ink md:text-7xl">
                        Making city parking simple
                    </h1>
                    <p className="mt-8 max-w-2xl text-lg text-ink-soft">
                        We&apos;re building a smarter way to find, book, and manage parking — connecting drivers with
                        trusted locations through a fast, dependable network.
                    </p>
                    <div className="mt-10 flex flex-wrap gap-4">
                        <Button size="lg">Our vision</Button>
                        <Button variant="secondary" size="lg">Contact us</Button>
                    </div>
                </motion.div>
            </section>

            <section className="mx-6 mb-24 overflow-hidden rounded-card-lg bg-asphalt py-24 text-white">
                <div className="mx-auto max-w-6xl px-10">
                    <div className="grid grid-cols-1 gap-16 md:grid-cols-3">
                        {[
                            { icon: Zap, title: 'Speed', desc: 'Real-time availability across the network, so bookings never lag behind reality.' },
                            { icon: Shield, title: 'Trust', desc: 'Every location is verified, and every transaction is protected.' },
                            { icon: Users, title: 'Community', desc: 'A growing network of drivers and lot owners, connected through one simple app.' }
                        ].map((item, i) => (
                            <motion.div
                                key={item.title}
                                initial={{ opacity: 0, y: 16 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                            >
                                <div className="mb-6 grid h-14 w-14 place-items-center rounded-card border border-white/15 bg-white/10">
                                    <item.icon className="h-6 w-6" aria-hidden="true" />
                                </div>
                                <h3 className="font-outfit text-2xl font-medium tracking-tight">{item.title}</h3>
                                <p className="mt-3 text-white/70">{item.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="mx-auto mb-32 max-w-6xl px-6 py-24">
                <div className="flex flex-col items-center gap-16 md:flex-row">
                    <div className="flex-1">
                        <h2 className="font-outfit text-4xl font-medium tracking-tight text-ink">Where we operate</h2>
                        <div className="mt-8 space-y-6">
                            {[
                                { label: 'Cities covered', value: '40+', icon: MapPin },
                                { label: 'Verified locations', value: '1,200+', icon: Users },
                                { label: 'Successful bookings', value: '2.4M+', icon: Shield }
                            ].map((stat) => (
                                <div key={stat.label} className="flex items-center gap-5">
                                    <div className="grid h-11 w-11 place-items-center rounded-card border border-hairline bg-surface">
                                        <stat.icon className="h-5 w-5 text-ignition" aria-hidden="true" />
                                    </div>
                                    <div>
                                        <p className="text-xs uppercase tracking-widest text-ink-soft">{stat.label}</p>
                                        <p className="font-outfit text-2xl font-medium text-ink">{stat.value}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="flex-1 rounded-card-lg border border-hairline bg-surface p-10">
                        <div className="flex aspect-square flex-col items-center justify-center rounded-card bg-white p-10 text-center">
                            <div className="mb-6 grid h-20 w-20 place-items-center rounded-full bg-ignition/10">
                                <Car className="h-10 w-10 text-ignition" aria-hidden="true" />
                            </div>
                            <h4 className="font-outfit text-lg font-medium text-ink">List your lot</h4>
                            <p className="mt-2 text-sm text-ink-soft">Join the ParkEase network and start earning.</p>
                            <Button className="mt-6 w-full">Get started</Button>
                        </div>
                    </div>
                </div>
            </section>

            <footer className="border-t border-hairline py-10 text-center">
                <p className="text-xs uppercase tracking-[0.3em] text-ink-soft">ParkEase © 2026</p>
            </footer>
        </div>
    );
};

export default About;
