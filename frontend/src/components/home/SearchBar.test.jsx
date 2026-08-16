import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SearchBar from './SearchBar';

describe('SearchBar', () => {
    it('calls onSearchTermChange and onSearch from the destination form', async () => {
        const onSearchTermChange = vi.fn();
        const onSearch = vi.fn((event) => event.preventDefault());
        render(<SearchBar searchTerm="" onSearchTermChange={onSearchTermChange} onSearch={onSearch} />);

        await userEvent.type(screen.getByPlaceholderText('City or area name'), 'S');
        expect(onSearchTermChange).toHaveBeenCalledWith('S');

        await userEvent.click(screen.getByRole('button', { name: /search/i }));
        expect(onSearch).toHaveBeenCalledTimes(1);
    });
});
