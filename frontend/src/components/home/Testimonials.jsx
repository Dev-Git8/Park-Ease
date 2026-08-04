import Eyebrow from '../ui/Eyebrow';
import TextReveal, { TEXT_EASE } from '../ui/TextReveal';
import Reveal from '../ui/Reveal';
import { TESTIMONIALS } from '../../data/homeContent';

const Testimonials = () => (
    <section id="testimonials" className="bg-background px-6 py-20 sm:px-10 sm:py-24">
        <Eyebrow>What drivers say</Eyebrow>
        <TextReveal
            as="h2"
            mode="lines"
            segments={['Loved by', 'drivers everywhere']}
            duration={950}
            ease={TEXT_EASE.expo}
            className="mt-4 text-5xl font-medium leading-[0.95] tracking-tight"
        />

        <ul className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-3">
            {TESTIMONIALS.map((testimonial, i) => (
                <Reveal
                    key={testimonial.name}
                    as="li"
                    from={{ opacity: 0, y: 40 }}
                    to={{ opacity: 1, y: 0 }}
                    delayIn={i * 120}
                    preset="reveal"
                    className="flex h-full flex-col justify-between rounded-card bg-surface p-7"
                >
                    <div>
                        <p className="text-4xl leading-none text-navy" aria-hidden="true">&ldquo;</p>
                        <blockquote className="mt-4 text-lg leading-relaxed text-ink">{testimonial.quote}</blockquote>
                    </div>
                    <figcaption className="mt-6 border-t border-hairline pt-4">
                        <p className="font-medium">{testimonial.name}</p>
                        <p className="text-sm text-ink-soft">{testimonial.role}</p>
                    </figcaption>
                </Reveal>
            ))}
        </ul>
    </section>
);

export default Testimonials;
