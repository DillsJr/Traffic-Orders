"use client";

import React from "react";

interface FacetsDesktopProps {
  availableFilters: Record<string, any>;
  selectedFilters: Record<string, any>;
  onFilterChange: (filterKey: string, value: any) => void;
}

export function FacetsDesktop({
  availableFilters,
  selectedFilters,
  onFilterChange,
}: FacetsDesktopProps) {
  return (
    <div className="facets-desktop">
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
    </div>
  );
}