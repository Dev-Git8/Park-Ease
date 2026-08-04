import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Eyebrow from '../ui/Eyebrow';
import TextReveal, { TEXT_EASE } from '../ui/TextReveal';
import Reveal from '../ui/Reveal';
import { SERVICES } from '../../data/homeContent';

const Services = () => (
    <section id="services" className="bg-surface px-6 py-24 sm:px-10">
        <Eyebrow>Parking services</Eyebrow>
        <TextReveal
            as="h2"
            mode="lines"
            segments={['Built for', 'every trip']}
            duration={950}
            ease={TEXT_EASE.expo}
            className="mt-4 text-5xl font-medium leading-[0.95] tracking-tight"
        />

        <ul className="mt-14">
            {SERVICES.map((service, i) => (
                <Reveal
                    key={service.index}
                    as="li"
                    delayIn={i * 90}
                    preset="reveal"
                    className={`border-t border-hairline ${i === SERVICES.length - 1 ? 'border-b' : ''}`}
                >
                    <motion.a
                        href={service.href}
                        initial="rest"
                        whileHover="hover"
                        animate="rest"
                        className="flex items-center gap-6 py-7 focus-visible:bg-background"
                    >
                        <span className="w-10 text-sm font-medium text-ink-soft">{service.index}</span>
                        <div className="flex-1">
                            <p className="text-2xl font-medium tracking-tight sm:text-3xl">{service.name}</p>
                            <p className="mt-1 text-sm text-ink-soft">{service.description}</p>
                        </div>
                        <motion.span
                            variants={{ rest: { x: 0, opacity: 0.55 }, hover: { x: 8, opacity: 1 } }}
                            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                            className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-pill border border-hairline"
                        >
                            <ArrowRight className="h-4 w-4" aria-hidden="true" />
                        </motion.span>
                    </motion.a>
                </Reveal>
            ))}
        </ul>
    </section>
);

export default Services;
