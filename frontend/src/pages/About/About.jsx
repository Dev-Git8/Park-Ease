import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Target, Zap, Users, Car, MapPin } from 'lucide-react';
import Button from '../../components/ui/Button';

const About = () => {
    return (
        <div className="min-h-screen bg-white">
            {/* Hero Section */}
            <section className="relative py-24 md:py-32 overflow-hidden">
                <div className="absolute top-0 right-0 w-1/2 h-full bg-slate-50/50 -skew-x-12 translate-x-1/4"></div>
                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <motion.div 
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="max-w-3xl"
                    >
                        <div className="flex items-center space-x-3 text-brand-accent font-black mb-6 uppercase tracking-[0.3em]">
                            <Target className="w-6 h-6" />
                            <span className="text-xs">Mission Intelligence</span>
                        </div>
                        <h1 className="text-6xl md:text-8xl font-black text-brand-black tracking-tighter leading-[0.9] mb-8">
                            Redefining Urban <br />
                            <span className="text-brand-accent">Mobility.</span>
                        </h1>
                        <p className="text-xl text-slate-500 font-medium leading-relaxed mb-12 max-w-2xl">
                            We are building the world&apos;s most advanced parking infrastructure management system, connecting drivers with premium locations through a seamless, high-performance network.
                        </p>
                        <div className="flex space-x-4">
                            <Button size="lg" className="rounded-2xl px-10">Our Vision</Button>
                            <Button variant="secondary" size="lg" className="rounded-2xl px-10">Contact Operations</Button>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Core Values */}
            <section className="py-24 bg-brand-black text-white rounded-[4rem] mx-6 mb-24 overflow-hidden relative">
                <div className="absolute top-0 right-0 p-24 opacity-10">
                    <Car className="w-96 h-96" />
                </div>
                <div className="max-w-7xl mx-auto px-10">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
                        {[
                            { icon: Zap, title: "Velocity", desc: "Real-time synchronization across the entire parking network for zero-latency bookings." },
                            { icon: Shield, title: "Integrity", desc: "Military-grade encryption protecting every transaction and user identity." },
                            { icon: Users, title: "Connectivity", desc: "A global community of providers and drivers interacting through a unified interface." }
                        ].map((item, i) => (
                            <motion.div 
                                key={i}
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                            >
                                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-8 border border-white/10">
                                    <item.icon className="w-8 h-8 text-brand-accent" />
                                </div>
                                <h3 className="text-2xl font-black uppercase tracking-tighter mb-4">{item.title}</h3>
                                <p className="text-slate-400 font-medium leading-relaxed">{item.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Global Reach */}
            <section className="py-24 max-w-7xl mx-auto px-6 mb-32">
                <div className="flex flex-col md:flex-row items-center gap-20">
                    <div className="flex-1">
                        <h2 className="text-5xl font-black text-brand-black tracking-tighter mb-8 uppercase">Global Network</h2>
                        <div className="space-y-8">
                             {[
                                 { label: "Operating Regions", value: "40+", icon: MapPin },
                                 { label: "Active Partners", value: "1,200+", icon: Users },
                                 { label: "Successful Missions", value: "2.4M+", icon: Shield }
                             ].map((stat, i) => (
                                 <div key={i} className="flex items-center space-x-6">
                                     <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100">
                                         <stat.icon className="w-6 h-6 text-brand-black" />
                                     </div>
                                     <div>
                                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                                         <p className="text-3xl font-black text-brand-black font-outfit">{stat.value}</p>
                                     </div>
                                 </div>
                             ))}
                        </div>
                    </div>
                    <div className="flex-1 bg-slate-50 p-12 rounded-[3.5rem] border border-slate-100">
                         <div className="aspect-square bg-white rounded-[2.5rem] shadow-premium flex items-center justify-center p-12">
                              <div className="text-center">
                                   <div className="w-32 h-32 bg-brand-accent/10 rounded-full flex items-center justify-center mx-auto mb-8">
                                        <Car className="w-16 h-16 text-brand-accent" />
                                   </div>
                                   <h4 className="text-xl font-black text-brand-black uppercase tracking-widest">Join the Network</h4>
                                   <p className="text-slate-400 font-medium mt-4 mb-8">Scale your operations with ParkEase.</p>
                                   <Button className="w-full">Get Started</Button>
                              </div>
                         </div>
                    </div>
                </div>
            </section>

            {/* Footer Tag */}
            <footer className="py-12 border-t border-slate-50 text-center">
                 <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em]">ParkEase Operations © 2026</p>
            </footer>
        </div>
    );
};

export default About;
