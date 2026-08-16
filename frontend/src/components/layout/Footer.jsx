import { Link } from 'react-router-dom';
import { Car, Mail, Phone } from 'lucide-react';
import Eyebrow from '../ui/Eyebrow';
import TextReveal, { TEXT_EASE } from '../ui/TextReveal';
import PillButton from '../ui/PillButton';
import Reveal from '../ui/Reveal';
import { useSiteUI } from '../../context/SiteUIContext';
import { CONTACT_INFO, FOOTER_LINKS, SOCIAL_LINKS } from '../../data/homeContent';

const LINK_CLASS = "inline-flex items-center transition-all duration-300 hover:text-white hover:translate-x-1";

const FooterColumn = ({ title, links }) => (
    <nav>
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/50">{title}</p>
        <ul className="mt-4 flex flex-col gap-3 text-sm text-white/80">
            {links.map((link) => (
                <li key={link.name}>
                    {link.to ? (
                        <Link to={link.to} className={LINK_CLASS}>{link.name}</Link>
                    ) : (
                        <a href={link.href} className={LINK_CLASS}>{link.name}</a>
                    )}
                </li>
            ))}
        </ul>
    </nav>
);

const Footer = () => {
    const { openContact } = useSiteUI();

    return (
        <footer id="contact" className="relative mt-3 overflow-hidden rounded-card-lg bg-asphalt px-6 py-14 text-white sm:px-10 sm:py-16">
            <div
                aria-hidden="true"
                className="pointer-events-none absolute -top-32 left-1/2 h-64 w-[36rem] -translate-x-1/2 rounded-full bg-ignition/25 blur-3xl"
            />
            <div className="relative flex flex-col gap-8 border-b border-white/15 pb-14 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <Eyebrow tone="light">Get started</Eyebrow>
                    <TextReveal
                        as="p"
                        mode="lines"
                        segments={['Ready to', 'park?']}
                        duration={950}
                        ease={TEXT_EASE.expo}
                        className="mt-4 text-6xl font-medium leading-[0.92] tracking-tight"
                    />
                </div>
                <Reveal delayIn={150} preset="reveal">
                    <PillButton variant="light" onClick={openContact}>Book a Visit</PillButton>
                </Reveal>
            </div>

            <div className="grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
                <div className="max-w-xs">
                    <div className="flex items-center gap-2 text-lg font-medium uppercase tracking-[0.2em]">
                        <Car className="h-5 w-5" aria-hidden="true" />
                        Parkease
                    </div>
                    <p className="mt-4 text-sm text-white/65">
                        A smarter way to find, book, and manage parking — from hourly spots to full parking lots.
                    </p>
                    <address className="mt-6 flex flex-col gap-2 text-sm not-italic text-white/80">
                        <a href={`mailto:${CONTACT_INFO.email}`} className="inline-flex items-center gap-2 hover:text-white">
                            <Mail className="h-4 w-4" aria-hidden="true" /> {CONTACT_INFO.email}
                        </a>
                        <a href={`tel:${CONTACT_INFO.phone.replace(/[^+\d]/g, '')}`} className="inline-flex items-center gap-2 hover:text-white">
                            <Phone className="h-4 w-4" aria-hidden="true" /> {CONTACT_INFO.phone}
                        </a>
                        <span className="text-white/55">{CONTACT_INFO.address}</span>
                    </address>
                </div>

                <FooterColumn title="Services" links={FOOTER_LINKS.services} />
                <FooterColumn title="Company" links={FOOTER_LINKS.company} />
                <FooterColumn title="Legal & Support" links={FOOTER_LINKS.legal} />
            </div>

            <div className="flex flex-col gap-5 border-t border-white/15 pt-8 text-sm text-white/60 sm:flex-row sm:items-center sm:justify-between">
                <p>© 2026 ParkEase. All rights reserved.</p>
                <nav className="flex gap-5">
                    {SOCIAL_LINKS.map((social) => (
                        <a key={social.name} href={social.href} className="hover:text-white">{social.name}</a>
                    ))}
                </nav>
            </div>
        </footer>
    );
};

export default Footer;
