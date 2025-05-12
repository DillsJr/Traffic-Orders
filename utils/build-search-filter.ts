import { ComparisonOperators, FilterBuilder, LogicalOperators } from "lib/algolia/filter-builder";
import type { PlatformCollection } from "lib/shopify/types";

type SearchParams = {
  categories?: string[];
  vendors?: string[];
  colors?: string[];
  minPrice?: number | null;
  maxPrice?: number | null;
  rating?: number | null;
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

  if (collection) {
    filter.where("collections.handle", collection.handle);
  }

  addCategoryFilters(filter, params.categories, separator);
  addArrayFilters(filter, {
    vendor: params.vendors,
    "flatOptions.Color": params.colors,
  });

  if (params.minPrice !== undefined || params.maxPrice !== undefined) {
    addPriceFilters(filter, params.minPrice || null, params.maxPrice || null);
  }

  if (params.rating !== undefined) {
    addRatingFilter(filter, params.rating);
  }

  return filter.build(LogicalOperators.And);
}

function addCategoryFilters(filter: FilterBuilder, categories: string[] = [], separator: string): void {
  if (categories.length === 0) return;

  const categoryFilters = categories.map((category) => {
    const level = Math.min(category.split(separator).length - 1, 2);
    return `hierarchicalCategories.lvl${level}:"${category}"`;
  });

  filter.raw(`(${categoryFilters.join(" OR ")})`);
}

function addArrayFilters(filter: FilterBuilder, fields: Record<string, string[] | undefined>): void {
  Object.entries(fields).forEach(([field, values]) => {
    if (values && values.length > 0) {
      filter.multi(field, values);
    }
  });
}

function addPriceFilters(filter: FilterBuilder, minPrice: number | null, maxPrice: number | null): void {
  if (minPrice !== null) {
    filter.numeric("minPrice", minPrice, ComparisonOperators.GreaterThanOrEqual);
  }
  if (maxPrice !== null) {
    filter.numeric("minPrice", maxPrice, ComparisonOperators.LessThanOrEqual);
  }
}

function addRatingFilter(filter: FilterBuilder, rating: number | null): void {
  if (rating !== null && rating > 0) {
    filter.numeric("avgRating", rating, ComparisonOperators.GreaterThanOrEqual);
  }
}