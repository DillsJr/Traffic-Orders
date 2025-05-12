"use client";

import React, { useState } from "react";

interface FacetsMobileProps {
  availableFilters: Record<string, any>;
  selectedFilters: Record<string, any>;
  onFilterChange: (filterKey: string, value: any) => void;
}

export function FacetsMobile({
  availableFilters,
  selectedFilters,
  onFilterChange,
}: FacetsMobileProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="facets-mobile">
      <button onClick={() => setIsOpen(!isOpen)}>Filters</button>
      {isOpen && (
        <div className="filter-popup">
          {Object.keys(availableFilters).map((filterKey) => (
            <div key={filterKey} className="filter-section">
              <h3>{filterKey}</h3>
              <ul>
                {availableFilters[filterKey].map((filterValue: any) => (
                  <li key={filterValue}>
                    <label>
                      <input
                        type="checkbox"
                        checked={selectedFilters[filterKey]?.includes(filterValue) || false}
                        onChange={() => onFilterChange(filterKey, filterValue)}
                      />
                      {filterValue}
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <button onClick={() => setIsOpen(false)}>Close</button>
        </div>
      )}
    </div>
  );
}