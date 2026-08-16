import { Navigation } from 'lucide-react';
import Reveal from '../ui/Reveal';

const SearchBar = ({ searchTerm, onSearchTermChange, onSearch }) => (
    <div className="relative z-20 -mt-14 px-6 sm:-mt-16 sm:px-10">
        <Reveal delayIn={200} preset="reveal">
            <form
                onSubmit={onSearch}
                className="mx-auto flex w-full max-w-4xl flex-col gap-4 rounded-card-lg bg-white p-5 text-ink shadow-xl sm:flex-row sm:items-end sm:gap-3 sm:p-6"
            >
                <label className="flex flex-1 flex-col gap-1.5">
                    <span className="text-[10px] font-medium uppercase tracking-widest text-ink-soft">Destination</span>
                    <input
                        value={searchTerm}
                        onChange={(event) => onSearchTermChange(event.target.value)}
                        placeholder="City or area name"
                        className="rounded-xl border border-hairline bg-surface px-4 py-3 text-sm font-medium outline-none focus:border-ignition"
                    />
                </label>
                <label className="flex flex-col gap-1.5 sm:w-40">
                    <span className="text-[10px] font-medium uppercase tracking-widest text-ink-soft">Arrival time</span>
                    <input
                        type="time"
                        className="rounded-xl border border-hairline bg-surface px-4 py-3 text-sm font-medium outline-none focus:border-ignition"
                    />
                </label>
                <label className="flex flex-col gap-1.5 sm:w-44">
                    <span className="text-[10px] font-medium uppercase tracking-widest text-ink-soft">Duration</span>
                    <select className="rounded-xl border border-hairline bg-surface px-4 py-3 text-sm font-medium outline-none focus:border-ignition">
                        <option>Select duration</option>
                        <option>1 Hour</option>
                        <option>4 Hours</option>
                        <option>Full Day</option>
                    </select>
                </label>
                <button
                    type="submit"
                    className="inline-flex items-center justify-center gap-2 rounded-pill bg-ignition py-3 pl-2 pr-6 text-white shadow-sm transition-transform hover:scale-105 active:scale-95 sm:py-3.5"
                >
                    <span className="grid h-8 w-8 place-items-center rounded-pill bg-ignition-dark">
                        <Navigation className="h-3.5 w-3.5 rotate-45" aria-hidden="true" />
                    </span>
                    <span className="text-[11px] font-medium uppercase tracking-widest">Search</span>
                </button>
            </form>
        </Reveal>
    </div>
);

export default SearchBar;
