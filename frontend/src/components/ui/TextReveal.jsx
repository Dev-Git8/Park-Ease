/* eslint-disable react-refresh/only-export-components -- easing constants are shared by every component that uses TextReveal, and belong next to it for discoverability */
import { Fragment, useEffect, useState } from 'react';

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

    const renderAnimatedText = (segment, i) => (
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
        </span>
    );

    // The inter-word space is a plain text node OUTSIDE each word's inline-block
    // wrapper (a sibling, not trailing content inside it). A space placed inside
    // an inline-block gets trimmed as end-of-line whitespace within that box's
    // own formatting context, which silently ran every word together.
    const renderWordSpacer = (i) => (mode === 'words' && i < segments.length - 1 ? ' ' : '');

    if (!clip) {
        return (
            <Tag className={className}>
                {segments.map((segment, i) => (
                    <Fragment key={`${segment}-${i}`}>
                        <span className={mode === 'lines' ? 'block' : 'inline-block'}>{renderAnimatedText(segment, i)}</span>
                        {renderWordSpacer(i)}
                    </Fragment>
                ))}
            </Tag>
        );
    }

    const clipPadding = mode === 'lines' ? 'pb-[0.14em]' : 'pb-[0.12em]';

    return (
        <Tag className={className}>
            {segments.map((segment, i) => (
                <Fragment key={`${segment}-${i}`}>
                    <span className={`overflow-hidden ${clipPadding} ${mode === 'lines' ? 'block' : 'inline-block'}`}>
                        {renderAnimatedText(segment, i)}
                    </span>
                    {renderWordSpacer(i)}
                </Fragment>
            ))}
        </Tag>
    );
};

export default TextReveal;
