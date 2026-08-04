import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Reveal from '../ui/Reveal';
import TextReveal, { TEXT_EASE } from '../ui/TextReveal';
import ArrowButton from '../ui/ArrowButton';
import CarouselDots from '../ui/CarouselDots';
import { TRUST_SLIDES, TRUST_BADGE } from '../../data/homeContent';
import { IMAGES } from '../../data/images';

const TrustCarousel = () => {
    const [active, setActive] = useState(0);
    const slide = TRUST_SLIDES[active];
    const [w1, w2, w3, w4] = slide.headline;

    const goTo = (index) => setActive(((index % TRUST_SLIDES.length) + TRUST_SLIDES.length) % TRUST_SLIDES.length);

    return (
        <section className="relative isolate overflow-hidden bg-background px-6 py-16 sm:px-10 sm:py-20">
            <div className="relative z-20 flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                <Reveal preset="reveal" className="grid h-28 w-28 shrink-0 place-items-center rounded-pill bg-surface text-center sm:h-32 sm:w-32">
                    <div>
                        <p className="text-2xl font-medium">{TRUST_BADGE.percent}</p>
                        <p className="mx-auto mt-1 max-w-[7em] text-[0.6rem] text-ink-soft">{TRUST_BADGE.percentCaption}</p>
                    </div>
                </Reveal>
                <Reveal delayIn={120} preset="reveal" className="max-w-md rounded-card bg-surface p-5 sm:p-6">
                    <article className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
                        <span className="inline-flex rounded-xl bg-background px-4 py-2 text-xl font-medium">{TRUST_BADGE.index}</span>
                        <div>
                            <h3 className="text-lg font-medium">{TRUST_BADGE.title}</h3>
                            <p className="mt-2 text-xs leading-relaxed text-ink-soft">{TRUST_BADGE.body}</p>
                        </div>
                    </article>
                </Reveal>
            </div>

            <h2 className="pointer-events-none relative z-0 mx-auto mt-12 max-w-[88rem] select-none text-center text-[8.2vw] font-medium uppercase leading-[1.02] tracking-tight">
                <span className="flex justify-between">
                    <TextReveal as="span" segments={[w1]} duration={700} ease={TEXT_EASE.expo} className="text-ghost" />
                    <TextReveal as="span" segments={[w2]} duration={700} ease={TEXT_EASE.expo} className="text-ghost" />
                </span>
                <span className="flex justify-between">
                    <TextReveal as="span" segments={[w3]} duration={700} ease={TEXT_EASE.expo} className="text-ink" />
                    <TextReveal as="span" segments={[w4]} duration={700} ease={TEXT_EASE.expo} className="text-ghost" />
                </span>
            </h2>

            <Reveal
                from={{ opacity: 0, y: 60, scale: 0.92 }}
                to={{ opacity: 1, y: 0, scale: 1 }}
                preset="reveal"
                className="relative z-10 mx-auto -mt-8 w-52 rotate-6 sm:-mt-16 sm:w-64"
            >
                <figure className="relative aspect-[3/4] overflow-hidden rounded-card bg-navy">
                    <AnimatePresence mode="wait">
                        <motion.img
                            key={slide.imageKey}
                            src={IMAGES[slide.imageKey]}
                            alt={slide.alt}
                            loading="lazy"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 260, damping: 26 }}
                            className="h-full w-full object-cover"
                        />
                    </AnimatePresence>
                    <figcaption className="absolute inset-x-3 bottom-3 rounded-xl bg-navy-deep/40 px-3 py-2 text-white backdrop-blur">
                        <p className="text-sm font-medium">{slide.name}</p>
                        <p className="text-[0.65rem] text-white/80">{slide.role}</p>
                    </figcaption>
                </figure>
            </Reveal>

            <div className="relative z-20 mt-12 flex items-center justify-between sm:mt-24">
                <ArrowButton direction="prev" variant="outline" onClick={() => goTo(active - 1)} />
                <CarouselDots count={TRUST_SLIDES.length} activeIndex={active} onSelect={goTo} tone="dark" />
                <ArrowButton direction="next" variant="solid" onClick={() => goTo(active + 1)} />
            </div>
        </section>
    );
};

export default TrustCarousel;
