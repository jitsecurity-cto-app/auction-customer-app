'use client';

import { useState, FormEvent } from 'react';

interface SearchBarProps {
  onSearch: (search: string, minPrice?: number, maxPrice?: number) => void;
  initialSearch?: string;
  initialMinPrice?: number;
  initialMaxPrice?: number;
}

export default function SearchBar({
  onSearch,
  initialSearch = '',
  initialMinPrice,
  initialMaxPrice
}: SearchBarProps) {
  const [search, setSearch] = useState(initialSearch);
  const [minPrice, setMinPrice] = useState(initialMinPrice?.toString() || '');
  const [maxPrice, setMaxPrice] = useState(initialMaxPrice?.toString() || '');

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // No input validation (intentional vulnerability)
    // No sanitization of search input (XSS vulnerability)
    const min = minPrice ? parseFloat(minPrice) : undefined;
    const max = maxPrice ? parseFloat(maxPrice) : undefined;

    onSearch(search, min, max);
  };

  const handleClear = () => {
    setSearch('');
    setMinPrice('');
    setMaxPrice('');
    onSearch('', undefined, undefined);
  };

  const hasFilters = search || minPrice || maxPrice;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex gap-3">
        <div className="relative flex-1">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            type="text"
            placeholder="Search auctions by title or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-300 pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
          />
        </div>
        <button
          type="submit"
          className="bg-primary-600 hover:bg-primary-700 text-white rounded-lg px-5 py-2.5 text-sm font-medium transition-colors"
        >
          Search
        </button>
        {hasFilters && (
          <button
            type="button"
            onClick={handleClear}
            className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors"
          >
            Clear
          </button>
        )}
      </div>
      <div className="flex gap-3">
        <input
          id="minPrice"
          type="number"
          placeholder="Min price"
          value={minPrice}
          onChange={(e) => setMinPrice(e.target.value)}
          step="0.01"
          min="0"
          className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
        />
        <input
          id="maxPrice"
          type="number"
          placeholder="Max price"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
          step="0.01"
          min="0"
          className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
        />
      </div>
    </form>
  );
}
