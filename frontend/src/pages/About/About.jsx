import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Zap, Users, Car, MapPin } from 'lucide-react';
import Button from '../../components/ui/Button';
import Eyebrow from '../../components/ui/Eyebrow';
import TextReveal, { TEXT_EASE } from '../../components/ui/TextReveal';
import Reveal from '../../components/ui/Reveal';
import CountUp from '../../components/ui/CountUp';

const FEATURES = [
    { icon: Zap, title: 'Speed', desc: 'Real-time availability across the network, so bookings never lag behind reality.' },
    { icon: Shield, title: 'Trust', desc: 'Every location is verified, and every transaction is protected.' },
    { icon: Users, title: 'Community', desc: 'A growing network of drivers and lot owners, connected through one simple app.' }
];

const STATS = [
    { label: 'Cities covered', value: '40+', icon: MapPin },
    { label: 'Verified locations', value: '1,200+', icon: Users },
    { label: 'Successful bookings', value: '2.4M+', icon: Shield }
];

const About = () => {
    return (
        <div className="min-h-screen overflow-hidden bg-white">
            <section className="relative mx-auto max-w-6xl px-6 py-24 md:py-32">
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -top-20 right-0 h-72 w-72 rounded-full bg-ignition/10 blur-3xl sm:h-96 sm:w-96"
                />
                <div className="relative max-w-3xl">
                    <Reveal preset="reveal">
                        <Eyebrow>Our mission</Eyebrow>
                    </Reveal>
                    <TextReveal
                        as="h1"
                        mode="lines"
                        segments={['Making city', 'parking simple']}
                        duration={950}
                        ease={TEXT_EASE.expo}
                        baseDelay={100}
                        className="mt-4 font-outfit text-6xl font-medium leading-[0.95] tracking-tight text-ink md:text-7xl"
                    />
                    <Reveal delayIn={250} preset="reveal">
                        <p className="mt-8 max-w-2xl text-lg text-ink-soft">
                            We&apos;re building a smarter way to find, book, and manage parking — connecting drivers with
                            trusted locations through a fast, dependable network.
                        </p>
                    </Reveal>
                    <Reveal delayIn={380} preset="reveal">
                        <div className="mt-10 flex flex-wrap gap-4">
                            <Button size="lg">Our vision</Button>
                            <Button variant="secondary" size="lg">Contact us</Button>
                        </div>
                    </Reveal>
                </div>
            </section>

            <section className="relative mx-6 mb-24 overflow-hidden rounded-card-lg bg-asphalt py-24 text-white">
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -bottom-24 left-1/2 h-72 w-[40rem] -translate-x-1/2 rounded-full bg-ignition/20 blur-3xl"
                />
                <div className="relative mx-auto max-w-6xl px-10">
                    <div className="grid grid-cols-1 gap-16 md:grid-cols-3">
                        {FEATURES.map((item, i) => (
                            <Reveal key={item.title} delayIn={i * 120} preset="reveal">
                                <motion.div whileHover={{ y: -6 }} transition={{ type: 'spring', stiffness: 260, damping: 22 }}>
                                    <div className="mb-6 grid h-14 w-14 place-items-center rounded-card border border-white/15 bg-white/10 transition-colors duration-300 hover:border-ignition/50 hover:bg-white/15">
                                        <item.icon className="h-6 w-6" aria-hidden="true" />
                                    </div>
                                    <h3 className="font-outfit text-2xl font-medium tracking-tight">{item.title}</h3>
                                    <p className="mt-3 text-white/70">{item.desc}</p>
                                </motion.div>
                            </Reveal>
                        ))}
                    </div>
                </div>
            </section>

            <section className="mx-auto mb-32 max-w-6xl px-6 py-24">
                <div className="flex flex-col items-center gap-16 md:flex-row">
                    <div className="flex-1">
                        <h2 className="font-outfit text-4xl font-medium tracking-tight text-ink">Where we operate</h2>
                        <div className="mt-8 space-y-6">
                            {STATS.map((stat, i) => (
                                <Reveal key={stat.label} delayIn={i * 100} preset="reveal">
                                    <div className="flex items-center gap-5">
                                        <div className="grid h-11 w-11 place-items-center rounded-card border border-hairline bg-surface">
                                            <stat.icon className="h-5 w-5 text-ignition" aria-hidden="true" />
                                        </div>
                                        <div>
                                            <p className="text-xs uppercase tracking-widest text-ink-soft">{stat.label}</p>
                                            <CountUp value={stat.value} duration={1.4 + i * 0.15} className="font-outfit text-2xl font-medium text-ink" />
                                        </div>
                                    </div>
                                </Reveal>
                            ))}
                        </div>
                    </div>
                    <Reveal delayIn={200} preset="reveal" className="flex-1">
                        <motion.div
                            whileHover={{ y: -4 }}
                            transition={{ type: 'spring', stiffness: 220, damping: 22 }}
                            className="rounded-card-lg border border-hairline bg-surface p-10 shadow-sm transition-shadow duration-300 hover:shadow-xl"
                        >
                            <div className="flex aspect-square flex-col items-center justify-center rounded-card bg-white p-10 text-center">
                                <div className="mb-6 grid h-20 w-20 place-items-center rounded-full bg-ignition/10">
                                    <Car className="h-10 w-10 text-ignition" aria-hidden="true" />
                                </div>
                                <h4 className="font-outfit text-lg font-medium text-ink">List your lot</h4>
                                <p className="mt-2 text-sm text-ink-soft">Join the ParkEase network and start earning.</p>
                                <Button className="mt-6 w-full">Get started</Button>
                            </div>
                        </motion.div>
                    </Reveal>
                </div>
            </section>

            <footer className="border-t border-hairline py-10 text-center">
                <p className="text-xs uppercase tracking-[0.3em] text-ink-soft">ParkEase © 2026</p>
            </footer>
        </div>
    );
};

export default About;
