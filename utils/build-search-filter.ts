import { ComparisonOperators, FilterBuilder, LogicalOperators } from "lib/algolia/filter-builder";
import type { PlatformCollection } from "lib/shopify/types";

type SearchParams = {
  categories?: string[];
  vendors?: string[];
  colors?: string[];
  minPrice?: number | null; // Optional number or null
  maxPrice?: number | null; // Optional number or null
  rating?: number | null;   // Optional number or null
};

export function buildSearchFilter({
  collection,
  params,
  separator,
}: {
  collection?: PlatformCollection | undefined;
  params: SearchParams;
  separator: string;
}): string {
  const filter = new FilterBuilder();

  // Filter by collection
  if (collection) {
    filter.where("collections.handle", collection.handle);
  }

  // Add advanced filters
  addCategoryFilters(filter, params.categories, separator);
  addArrayFilters(filter, {
    vendor: params.vendors,
    "flatOptions.Color": params.colors,
  });

  // Check if minPrice and maxPrice are defined before calling
  if (params.minPrice !== undefined || params.maxPrice !== undefined) {
    addPriceFilters(filter, params.minPrice || null, params.maxPrice || null);
  }

  // Check if rating is defined before calling
  if (params.rating !== undefined) {
    addRatingFilter(filter, params.rating);
  }

  return filter.build(LogicalOperators.And);
}

// Helper function to add category filters
function addCategoryFilters(filter: FilterBuilder, categories: string[] = [], separator: string): void {
  if (categories.length === 0) return;

  const categoryFilters = categories.map((category) => {
    const level = Math.min(category.split(separator).length - 1, 2);
    return `hierarchicalCategories.lvl${level}:"${category}"`;
  });

  filter.raw(`(${categoryFilters.join(" OR ")})`);
}

// Helper function to add array-based filters
function addArrayFilters(filter: FilterBuilder, fields: Record<string, string[] | undefined>): void {
  Object.entries(fields).forEach(([field, values]) => {
    if (values && values.length > 0) {
      filter.multi(field, values);
    }
  });
}

// Helper function to add price range filters
function addPriceFilters(filter: FilterBuilder, minPrice: number | null, maxPrice: number | null): void {
  if (minPrice !== null) {
    filter.numeric("minPrice", minPrice, ComparisonOperators.GreaterThanOrEqual);
  }
  if (maxPrice !== null) {
    filter.numeric("minPrice", maxPrice, ComparisonOperators.LessThanOrEqual);
  }
}

// Helper function to add rating filters
function addRatingFilter(filter: FilterBuilder, rating: number | null): void {
  if (rating !== null && rating > 0) {
    filter.numeric("avgRating", rating, ComparisonOperators.GreaterThanOrEqual);
  }
}