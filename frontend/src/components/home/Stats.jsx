import Eyebrow from '../ui/Eyebrow';
import TextReveal, { TEXT_EASE } from '../ui/TextReveal';
import Reveal from '../ui/Reveal';
import CountUp from '../ui/CountUp';
import { STATS } from '../../data/homeContent';

const Stats = () => (
    <section className="mt-3 rounded-card-lg bg-asphalt px-6 py-20 text-white sm:px-10">
        <Eyebrow tone="light">By the numbers</Eyebrow>
        <TextReveal
            as="h2"
            mode="lines"
            segments={['A network that', 'keeps you moving']}
            duration={950}
            ease={TEXT_EASE.expo}
            className="mt-4 text-5xl font-medium leading-[0.95] tracking-tight"
        />

        <dl className="mt-16 grid grid-cols-2 gap-x-8 gap-y-12 lg:grid-cols-4">
            {STATS.map((stat, i) => (
                <Reveal
                    key={stat.label}
                    as="div"
                    from={{ opacity: 0, y: 30 }}
                    to={{ opacity: 1, y: 0 }}
                    delayIn={i * 110}
                    preset="reveal"
                    className="border-t border-white/20 pt-5"
                >
                    <dt className="sr-only">{stat.label}</dt>
                    <dd>
                        <CountUp value={stat.value} duration={1.4 + i * 0.15} className="text-6xl font-medium tracking-tight sm:text-7xl" />
                        <p className="mt-3 text-sm text-white/65">{stat.label}</p>
                    </dd>
                </Reveal>
            ))}
        </dl>
    </section>
);

export default Stats;
