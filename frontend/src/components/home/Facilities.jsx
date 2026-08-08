import { motion } from 'framer-motion';
import Reveal from '../ui/Reveal';
import TextReveal, { TEXT_EASE } from '../ui/TextReveal';
import { FACILITIES } from '../../data/homeContent';
import { IMAGES } from '../../data/images';

const TONE_CAPTION_CLASSES = {
    clay: 'bg-asphalt/40',
    blue: 'bg-pulse/55',
};

const Facilities = () => (
    <section id="facilities" className="-mt-10 rounded-card-lg bg-background px-6 pb-20 pt-16 sm:px-10">
        <div className="grid items-end gap-10 md:grid-cols-2">
            <div className="max-w-sm">
                <Reveal from={{ opacity: 0, scale: 0.85 }} to={{ opacity: 1, scale: 1 }} preset="reveal">
                    <img
                        src={IMAGES.facilityGarage}
                        alt="Parking facility icon"
                        loading="lazy"
                        className="h-16 w-16 rounded-card object-cover"
                    />
                </Reveal>
                <TextReveal
                    as="h2"
                    mode="lines"
                    segments={['Tour Our', 'Parking', 'Facilities']}
                    stagger={120}
                    duration={950}
                    ease={TEXT_EASE.expo}
                    className="mt-6 text-5xl font-medium leading-[0.95] tracking-tight"
                />
                <TextReveal
                    as="p"
                    mode="words"
                    clip={false}
                    distance="18px"
                    segments={
                        'Reserve a spot for quick errands, daily commutes, or long-term storage — and park in facilities built for security and convenience.'.split(
                            ' '
                        )
                    }
                    stagger={28}
                    baseDelay={250}
                    duration={700}
                    ease={TEXT_EASE.quart}
                    className="mt-6 max-w-xs text-sm text-ink-soft"
                />
            </div>

            <div className="flex items-end gap-5">
                {FACILITIES.map((facility, i) => (
                    <Reveal
                        key={facility.name}
                        from={{ opacity: 0, y: 48 }}
                        to={{ opacity: 1, y: 0 }}
                        delayIn={i * 140}
                        preset="reveal"
                        className={`flex-1 ${i === 1 ? 'mb-8' : ''}`}
                    >
                        <motion.figure initial="rest" whileHover="hover" animate="rest" className="relative aspect-[3/4] overflow-hidden rounded-card bg-surface">
                            <motion.img
                                src={IMAGES[facility.imageKey]}
                                alt={facility.alt}
                                loading="lazy"
                                variants={{ rest: { scale: 1 }, hover: { scale: 1.03 } }}
                                transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                                className="h-full w-full object-cover"
                            />
                            <figcaption className={`absolute inset-x-3 bottom-3 rounded-xl px-4 py-3 text-white backdrop-blur ${TONE_CAPTION_CLASSES[facility.tone]}`}>
                                <p className="text-sm font-medium">{facility.name}</p>
                                <p className="mt-1 text-[0.65rem] text-white/85">{facility.description}</p>
                            </figcaption>
                        </motion.figure>
                    </Reveal>
                ))}
            </div>
        </div>
    </section>
);

export default Facilities;
