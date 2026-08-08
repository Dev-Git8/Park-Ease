const TEXT_TONES = {
    dark: 'text-ink-soft',
    light: 'text-white/70',
};

const DOT_TONES = {
    dark: 'bg-ignition',
    light: 'bg-ignition-light',
};

const Eyebrow = ({ children, tone = 'dark', className = '' }) => (
    <span className={`inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.22em] ${TEXT_TONES[tone]} ${className}`}>
        <span className={`h-1.5 w-1.5 rounded-pill ${DOT_TONES[tone]}`} aria-hidden="true" />
        {children}
    </span>
);

export default Eyebrow;
