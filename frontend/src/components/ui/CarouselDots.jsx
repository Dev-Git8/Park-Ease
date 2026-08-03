const CarouselDots = ({ count, activeIndex, onSelect, tone = 'dark' }) => {
    const activeColor = tone === 'dark' ? 'bg-ink' : 'bg-white';
    const idleColor = tone === 'dark' ? 'bg-ghost' : 'bg-white/40';

    return (
        <div className="flex items-center gap-2">
            {Array.from({ length: count }).map((_, i) => (
                <button
                    key={i}
                    type="button"
                    aria-current={i === activeIndex}
                    aria-label={`Go to slide ${i + 1}`}
                    onClick={() => onSelect(i)}
                    className="p-1.5"
                >
                    <span
                        className={`block h-1.5 rounded-pill transition-all duration-300 ${
                            i === activeIndex ? `w-5 ${activeColor}` : `w-1.5 ${idleColor}`
                        }`}
                    />
                </button>
            ))}
        </div>
    );
};

export default CarouselDots;
