import { useEffect, useState } from 'react';

const useMediaQuery = (query) => {
    const [matches, setMatches] = useState(() => window.matchMedia(query).matches);

    useEffect(() => {
        const mediaQueryList = window.matchMedia(query);
        const listener = (event) => setMatches(event.matches);
        // eslint-disable-next-line react-hooks/set-state-in-effect -- re-syncs matches when the `query` prop itself changes, not on every render
        setMatches(mediaQueryList.matches);
        mediaQueryList.addEventListener('change', listener);
        return () => mediaQueryList.removeEventListener('change', listener);
    }, [query]);

    return matches;
};

export default useMediaQuery;
