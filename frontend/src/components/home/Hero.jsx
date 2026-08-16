import { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import TextReveal, { TEXT_EASE } from '../ui/TextReveal';
import Reveal from '../ui/Reveal';
import CarouselDots from '../ui/CarouselDots';
import { HERO_CONTENT, HERO_STAT } from '../../data/homeContent';
import { IMAGES } from '../../data/images';

const SLIDE_INTERVAL_MS = 3800;
const CARD_SIZE = 'h-32 w-60 sm:w-64';

const FeaturedSlide = ({ slide, ready, activeIndex, count, onSelectDot }) => {
    if (!slide) return null;
    return (
        <div className={`relative ${CARD_SIZE} shrink-0`}>
            <motion.a
                key={slide.id}
                href={`/business/${slide.id}`}
                initial={{ opacity: 0, y: 16, scale: 0.96 }}
                animate={ready ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 16, scale: 0.96 }}
                whileHover="hover"
                transition={{ type: 'spring', stiffness: 210, damping: 24 }}
                className="group absolute inset-0 flex overflow-hidden rounded-card border border-white/15 shadow-lg"
            >
                {slide.imageUrl && (
                    <motion.img
                        src={slide.imageUrl}
                        alt={slide.name}
                        loading="lazy"
                        variants={{ rest: { scale: 1 }, hover: { scale: 1.08 } }}
                        initial="rest"
                        transition={{ type: 'spring', stiffness: 260, damping: 26 }}
                        className="absolute inset-0 h-full w-full object-cover"
                    />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-asphalt/95 via-asphalt/25 to-transparent" />

                <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-pill bg-white/15 px-2.5 py-1 text-[0.6rem] font-medium uppercase tracking-widest text-white backdrop-blur-sm">
                    <span className="h-1.5 w-1.5 rounded-full bg-ignition" aria-hidden="true" />
                    Featured
                </span>

                <div className="relative mt-auto flex w-full items-end p-3">
                    <div className="min-w-0">
                        <p className="truncate text-sm font-semibold uppercase leading-tight tracking-wide">{slide.name}</p>
                        <span className="mt-0.5 inline-flex items-center gap-1 text-[0.65rem] uppercase tracking-wide text-white/75 transition-colors group-hover:text-white">
                            View spot
                            <ArrowUpRight className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
                        </span>
                    </div>
                </div>
            </motion.a>

            {count > 1 && (
                <div className="pointer-events-none absolute inset-x-3 bottom-3 z-10 flex justify-end">
                    <div className="pointer-events-auto">
                        <CarouselDots count={count} activeIndex={activeIndex} onSelect={onSelectDot} tone="light" />
                    </div>
                </div>
            )}
        </div>
    );
};

const Hero = ({ businesses, ready }) => {
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
            className="relative isolate flex min-h-[36rem] flex-col overflow-hidden rounded-card-lg bg-asphalt text-white"
            style={{ height: 'calc(100svh - 6.5rem)' }}
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
                <div className="absolute inset-0 bg-gradient-to-b from-asphalt/65 via-asphalt/35 to-asphalt/75" />
            </div>

            <div className="flex flex-1 flex-col justify-center gap-10 px-6 py-16 sm:px-10">
                <TextReveal
                    as="h1"
                    mode="words"
                    segments={HERO_CONTENT.titleWords}
                    play={ready}
                    stagger={140}
                    duration={1100}
                    ease={TEXT_EASE.expo}
                    className="whitespace-nowrap text-[clamp(2.5rem,10vw,8.5rem)] font-bold uppercase leading-[0.85] tracking-tight"
                />

                <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                    <TextReveal
                        as="p"
                        mode="lines"
                        segments={HERO_CONTENT.taglineLines}
                        play={ready}
                        baseDelay={350}
                        stagger={110}
                        duration={900}
                        ease={TEXT_EASE.expo}
                        className="text-[clamp(1.5rem,4.2vw,3rem)] font-medium uppercase leading-[0.95] tracking-tight text-white"
                    />

                    <div className="flex items-stretch gap-4">
                        {slides.length > 0 && (
                            <div className="hidden md:block">
                                <FeaturedSlide
                                    slide={currentSlide}
                                    ready={ready}
                                    count={slides.length}
                                    activeIndex={activeSlide}
                                    onSelectDot={setActiveSlide}
                                />
                            </div>
                        )}

                        <Reveal delayIn={780} preset="reveal">
                            <motion.article
                                initial="rest"
                                whileHover="hover"
                                className={`relative flex ${CARD_SIZE} items-stretch overflow-hidden rounded-card border border-white/15 bg-white/10 shadow-lg backdrop-blur`}
                            >
                                <div className="flex flex-1 flex-col justify-between p-4">
                                    <div className="flex items-center gap-1.5 text-[0.6rem] font-medium uppercase tracking-widest text-white/70">
                                        <span className="relative flex h-1.5 w-1.5">
                                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ignition opacity-75" />
                                            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-ignition" />
                                        </span>
                                        Live
                                    </div>
                                    <div>
                                        <p className="text-4xl font-bold leading-none">{HERO_STAT.value}</p>
                                        <div className="mt-3 flex -space-x-2">
                                            {HERO_STAT.dotColors.map((color, i) => (
                                                <span
                                                    key={`${color}-${i}`}
                                                    className="h-5 w-5 rounded-pill border-2 border-asphalt/60"
                                                    style={{ backgroundColor: color }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                    <p className="text-[0.65rem] text-white/75">{HERO_STAT.caption}</p>
                                </div>
                                <motion.img
                                    src={IMAGES.heroStatCard}
                                    alt="Close-up of a car parked in a parking lot"
                                    loading="lazy"
                                    variants={{ rest: { scale: 1 }, hover: { scale: 1.08 } }}
                                    transition={{ type: 'spring', stiffness: 260, damping: 26 }}
                                    className="h-full w-24 object-cover sm:w-28"
                                />
                            </motion.article>
                        </Reveal>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Hero;
