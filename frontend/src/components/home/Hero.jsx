import { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Navigation } from 'lucide-react';
import TextReveal, { TEXT_EASE } from '../ui/TextReveal';
import Reveal from '../ui/Reveal';
import CarouselDots from '../ui/CarouselDots';
import { HERO_CONTENT, HERO_STAT } from '../../data/homeContent';
import { IMAGES } from '../../data/images';

const SLIDE_INTERVAL_MS = 3800;

const FeaturedSlide = ({ slide, ready }) => {
    if (!slide) return null;
    return (
        <motion.a
            key={slide.id}
            href={`/business/${slide.id}`}
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={ready ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 16, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 210, damping: 24 }}
            className="flex items-center gap-3 rounded-card border border-white/15 bg-white/10 p-3 shadow-lg backdrop-blur"
        >
            <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl bg-white/10">
                {slide.imageUrl && <img src={slide.imageUrl} alt={slide.name} loading="lazy" className="h-full w-full object-cover" />}
            </div>
            <div className="min-w-0">
                <p className="truncate text-[0.7rem] font-medium uppercase tracking-wide">Featured Location</p>
                <p className="truncate text-[0.7rem] uppercase text-white/80">{slide.name}</p>
                <span className="text-[0.65rem] underline">View spot →</span>
            </div>
        </motion.a>
    );
};

const Hero = ({ businesses, searchTerm, onSearchTermChange, onSearch, ready }) => {
    const sectionRef = useRef(null);
    const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end start'] });
    const parallaxY = useTransform(scrollYProgress, [0, 1], ['0%', '12%']);

    const slides = businesses.slice(0, 3);
    const [activeSlide, setActiveSlide] = useState(0);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- resets the active index when a fresh (differently-sized) business list arrives, so it can't point past the new end
        setActiveSlide(0);
    }, [slides.length]);

    useEffect(() => {
        if (!ready || slides.length < 2) return undefined;
        const timer = window.setInterval(() => {
            setActiveSlide((prev) => (prev + 1) % slides.length);
        }, SLIDE_INTERVAL_MS);
        return () => window.clearInterval(timer);
    }, [ready, slides.length]);

    const currentSlide = slides[activeSlide];

    return (
        <section
            ref={sectionRef}
            className="relative isolate flex min-h-[36rem] flex-col overflow-hidden rounded-card-lg bg-navy-deep text-white"
            style={{ height: 'calc(100svh - 1rem)' }}
        >
            <div className="absolute inset-0 -z-10">
                <motion.div style={{ y: parallaxY, top: '-16%', height: '132%' }} className="absolute left-0 right-0 w-full">
                    <img
                        src={IMAGES.heroBackground}
                        alt="Rows of cars parked in a parking lot, seen from above"
                        loading="eager"
                        fetchPriority="high"
                        className="h-full w-full object-cover"
                    />
                </motion.div>
                <div className="absolute inset-0 bg-gradient-to-b from-navy-deep/65 via-navy-deep/35 to-navy-deep/75" />
            </div>

            <div className="mt-24 px-6 sm:px-10">
                <TextReveal
                    as="h1"
                    mode="words"
                    segments={HERO_CONTENT.titleWords}
                    play={ready}
                    stagger={140}
                    duration={1100}
                    ease={TEXT_EASE.expo}
                    className="whitespace-nowrap text-[12.5vw] font-medium uppercase leading-[0.85] tracking-tight"
                />
            </div>

            <div className="mt-auto flex flex-col gap-6 px-6 pb-6 sm:flex-row sm:items-end sm:justify-between sm:px-10 sm:pb-8">
                <TextReveal
                    as="p"
                    mode="lines"
                    segments={HERO_CONTENT.taglineLines}
                    play={ready}
                    baseDelay={350}
                    stagger={110}
                    duration={900}
                    ease={TEXT_EASE.expo}
                    className="text-[2.4rem] font-medium uppercase leading-[0.95] tracking-tight text-white/85"
                />

                <div className="flex items-end gap-4">
                    {slides.length > 0 && (
                        <div className="hidden w-64 flex-col gap-3 md:flex">
                            <FeaturedSlide slide={currentSlide} ready={ready} />
                            <CarouselDots count={slides.length} activeIndex={activeSlide} onSelect={setActiveSlide} tone="light" />
                        </div>
                    )}

                    <Reveal delayIn={780} preset="reveal">
                        <article className="flex w-full max-w-[20rem] items-stretch gap-3 rounded-card border border-white/15 bg-white/10 p-3 shadow-lg backdrop-blur sm:max-w-[15rem]">
                            <div className="flex flex-1 flex-col justify-between">
                                <p className="text-3xl font-medium leading-none">{HERO_STAT.value}</p>
                                <div className="flex -space-x-2">
                                    {HERO_STAT.dotColors.map((color, i) => (
                                        <span
                                            key={`${color}-${i}`}
                                            className="h-5 w-5 rounded-pill border border-navy-deep/40"
                                            style={{ backgroundColor: color }}
                                        />
                                    ))}
                                </div>
                                <p className="text-[0.65rem] text-white/80">{HERO_STAT.caption}</p>
                            </div>
                            <img
                                src={IMAGES.heroStatCard}
                                alt="Close-up of a car parked in a parking lot"
                                loading="lazy"
                                className="aspect-[3/4] w-16 rounded-xl object-cover"
                            />
                        </article>
                    </Reveal>
                </div>
            </div>

            <form onSubmit={onSearch} className="mx-6 mb-6 flex flex-col gap-4 rounded-card bg-white/95 p-6 text-ink shadow-xl sm:mx-10 sm:mb-8 sm:max-w-md">
                <label className="flex flex-col gap-1">
                    <span className="text-[11px] font-medium uppercase tracking-widest text-ink-soft">Destination</span>
                    <input
                        value={searchTerm}
                        onChange={(event) => onSearchTermChange(event.target.value)}
                        placeholder="City or area name"
                        className="rounded-2xl border border-hairline bg-surface px-5 py-4 text-sm font-medium outline-none focus:border-navy-light"
                    />
                </label>
                <div className="grid grid-cols-2 gap-3">
                    <label className="flex flex-col gap-1">
                        <span className="text-[11px] font-medium uppercase tracking-widest text-ink-soft">Arrival time</span>
                        <input type="time" className="rounded-2xl border border-hairline bg-surface px-4 py-3 text-sm font-medium outline-none focus:border-navy-light" />
                    </label>
                    <label className="flex flex-col gap-1">
                        <span className="text-[11px] font-medium uppercase tracking-widest text-ink-soft">Duration</span>
                        <select className="rounded-2xl border border-hairline bg-surface px-4 py-3 text-sm font-medium outline-none focus:border-navy-light">
                            <option>Select duration</option>
                            <option>1 Hour</option>
                            <option>4 Hours</option>
                            <option>Full Day</option>
                        </select>
                    </label>
                </div>
                <button
                    type="submit"
                    className="inline-flex items-center gap-3 self-start rounded-pill bg-navy pl-2 pr-6 py-2 text-white shadow-sm transition-transform hover:scale-105 active:scale-95"
                >
                    <span className="grid h-8 w-8 place-items-center rounded-pill bg-navy-deep">
                        <Navigation className="h-3 w-3 rotate-45" aria-hidden="true" />
                    </span>
                    <span className="text-[11px] font-medium uppercase tracking-widest">Search</span>
                </button>
            </form>
        </section>
    );
};

export default Hero;
