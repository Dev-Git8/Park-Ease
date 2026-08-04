import { ArrowRight, MapPin, Star } from 'lucide-react';
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
                    <Reveal key={biz.id} as="article" delayIn={i * 80} preset="reveal" className="rounded-card-lg border border-hairline bg-surface-card p-4 shadow-lg">
                        <div className="relative h-56 w-full overflow-hidden rounded-card bg-surface">
                            {biz.imageUrl ? (
                                <img src={biz.imageUrl} alt={biz.name} loading="lazy" className="h-full w-full object-cover" />
                            ) : (
                                <div className="h-full w-full bg-gradient-to-br from-navy-light to-navy-deep" />
                            )}
                            <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/60 to-transparent p-5">
                                <span className="inline-flex items-center gap-2 text-white">
                                    <Star className="h-4 w-4 fill-current" aria-hidden="true" />
                                    <span className="text-xs font-medium uppercase tracking-widest">4.9 Rating</span>
                                </span>
                            </div>
                        </div>
                        <div className="px-2 pb-2 pt-5">
                            <h3 className="text-2xl font-medium tracking-tight">{biz.name}</h3>
                            <p className="mt-2 flex items-center gap-2 text-xs text-ink-soft">
                                <MapPin className="h-3.5 w-3.5 text-navy" aria-hidden="true" />
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
                                    className="inline-flex items-center gap-2 rounded-pill bg-ink px-5 py-3 text-xs font-medium uppercase tracking-widest text-white transition-colors hover:bg-navy-deep"
                                >
                                    Book Now
                                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                                </Link>
                            </div>
                        </div>
                    </Reveal>
                ))}
            </div>
        )}
    </section>
);

export default Listings;
