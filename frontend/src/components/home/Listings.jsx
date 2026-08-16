import { motion } from 'framer-motion';
import { ArrowRight, MapPin, ShieldCheck, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import Eyebrow from '../ui/Eyebrow';
import TextReveal, { TEXT_EASE } from '../ui/TextReveal';
import Reveal from '../ui/Reveal';

const Listings = ({ businesses, loading }) => (
    <section id="listings" className="bg-background px-6 py-24 sm:px-10">
        <Eyebrow>Verified network</Eyebrow>
        <TextReveal
            as="h2"
            mode="lines"
            segments={['Available', 'locations']}
            duration={950}
            ease={TEXT_EASE.expo}
            className="mt-4 text-5xl font-medium leading-[0.95] tracking-tight"
        />

        {loading ? (
            <div className="mt-14 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-80 animate-pulse rounded-card-lg bg-surface" />
                ))}
            </div>
        ) : businesses.length === 0 ? (
            <p className="mt-14 text-sm text-ink-soft">No locations match your search yet — try another destination.</p>
        ) : (
            <div className="mt-14 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                {businesses.map((biz, i) => (
                    <Reveal key={biz.id} as="article" delayIn={i * 80} preset="reveal">
                        <motion.div
                            initial="rest"
                            whileHover="hover"
                            animate="rest"
                            variants={{ rest: { y: 0 }, hover: { y: -6 } }}
                            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                            className="group h-full rounded-card-lg border border-hairline bg-surface-card p-4 shadow-lg transition-shadow duration-300 hover:border-ink/15 hover:shadow-2xl"
                        >
                            <div className="relative h-56 w-full overflow-hidden rounded-card bg-surface">
                                {biz.imageUrl ? (
                                    <motion.img
                                        src={biz.imageUrl}
                                        alt={biz.name}
                                        loading="lazy"
                                        variants={{ rest: { scale: 1 }, hover: { scale: 1.06 } }}
                                        transition={{ type: 'spring', stiffness: 260, damping: 26 }}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <div className="h-full w-full bg-gradient-to-br from-ignition-light to-asphalt" />
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/5 to-transparent" />
                                <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-pill bg-white/90 px-2.5 py-1 text-ink shadow-sm backdrop-blur">
                                    <Star className="h-3 w-3 fill-ignition text-ignition" aria-hidden="true" />
                                    <span className="text-[0.65rem] font-semibold tracking-wide">4.9</span>
                                </span>
                                <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-pill bg-black/35 px-2.5 py-1 text-white backdrop-blur">
                                    <ShieldCheck className="h-3 w-3 text-ignition-light" aria-hidden="true" />
                                    <span className="text-[0.6rem] font-medium uppercase tracking-widest">Verified</span>
                                </span>
                            </div>
                            <div className="px-2 pb-2 pt-5">
                                <h3 className="text-2xl font-medium tracking-tight">{biz.name}</h3>
                                <p className="mt-2 flex items-center gap-2 text-xs text-ink-soft">
                                    <MapPin className="h-3.5 w-3.5 text-ignition" aria-hidden="true" />
                                    {biz.address}
                                </p>
                                <div className="mt-5 flex items-center justify-between border-t border-hairline pt-4">
                                    <div>
                                        <p className="text-[10px] font-medium uppercase tracking-widest text-ink-soft">Fee</p>
                                        <p className="text-2xl font-medium">
                                            ${biz.pricePerHour}
                                            <span className="ml-1 text-xs uppercase text-ink-soft">/hr</span>
                                        </p>
                                    </div>
                                    <Link
                                        to={`/business/${biz.id}`}
                                        className="inline-flex items-center gap-2 rounded-pill bg-ink px-5 py-3 text-xs font-medium uppercase tracking-widest text-white transition-colors hover:bg-ignition-dark"
                                    >
                                        Book Now
                                        <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
                                    </Link>
                                </div>
                            </div>
                        </motion.div>
                    </Reveal>
                ))}
            </div>
        )}
    </section>
);

export default Listings;
