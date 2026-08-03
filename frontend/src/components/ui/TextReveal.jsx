/* eslint-disable react-refresh/only-export-components -- easing constants are shared by every component that uses TextReveal, and belong next to it for discoverability */
import { useEffect, useState } from 'react';

export const EASE_OUT_EXPO = [0.16, 1, 0.3, 1];
export const EASE_OUT_QUART = [0.25, 1, 0.5, 1];
export const TEXT_EASE = { expo: EASE_OUT_EXPO, quart: EASE_OUT_QUART };

const TextReveal = ({
    segments,
    as: Tag = 'span',
    mode = 'words',
    clip = true,
    distance = '115%',
    play = true,
    stagger = 120,
    baseDelay = 0,
    duration = 950,
    ease = EASE_OUT_EXPO,
    className = '',
    segmentClassName = '',
}) => {
    const [visible, setVisible] = useState(false);
    const contentKey = segments.join('|');

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- resetting local visibility so a later prop/content change replays the CSS transition, not a derived-state anti-pattern
        setVisible(false);
        if (!play) {
            return undefined;
        }
        const timer = setTimeout(() => setVisible(true), 0);
        return () => clearTimeout(timer);
        // contentKey re-fires the reveal whenever the active text changes (carousels).
    }, [play, contentKey]);

    const renderSegment = (segment, i) => (
        <span
            className={`inline-block ${segmentClassName}`}
            style={{
                transform: visible ? 'translateY(0)' : `translateY(${distance})`,
                opacity: visible ? 1 : 0,
                transitionProperty: 'transform, opacity',
                transitionDuration: `${duration}ms`,
                transitionTimingFunction: `cubic-bezier(${ease.join(',')})`,
                transitionDelay: `${baseDelay + i * stagger}ms`,
            }}
        >
            {segment}
            {mode === 'words' && i < segments.length - 1 ? ' ' : ''}
        </span>
    );

    if (!clip) {
        return (
            <Tag className={className}>
                {segments.map((segment, i) => (
                    <span key={`${segment}-${i}`} className={mode === 'lines' ? 'block' : 'inline-block'}>
                        {renderSegment(segment, i)}
                    </span>
                ))}
            </Tag>
        );
    }

    const clipPadding = mode === 'lines' ? 'pb-[0.14em]' : 'pb-[0.12em]';

    return (
        <Tag className={className}>
            {segments.map((segment, i) => (
                <span key={`${segment}-${i}`} className={`overflow-hidden ${clipPadding} ${mode === 'lines' ? 'block' : 'inline-block'}`}>
                    {renderSegment(segment, i)}
                </span>
            ))}
        </Tag>
    );
};

export default TextReveal;
