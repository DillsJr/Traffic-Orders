import { searchParamsCache } from "components/search-view"
import { ComparisonOperators, FilterBuilder, LogicalOperators } from "lib/algolia/filter-builder"
import type { PlatformCollection } from "lib/shopify/types"

type SearchParams = Omit<Awaited<ReturnType<typeof searchParamsCache.parse>>, "page" | "sortBy" | "q">

function validateFilters(params: SearchParams): boolean {
  const { minPrice, maxPrice, rating } = params;
  if (minPrice && maxPrice && minPrice > maxPrice) {
    console.warn("Invalid price range: minPrice cannot be greater than maxPrice.");
    return false;
  }
  if (rating && (rating < 0 || rating > 5)) {
    console.warn("Invalid rating: Rating must be between 0 and 5.");
    return false;
  }
  return true;
}

export function buildSearchFilter({ collection, params, separator }: { collection?: PlatformCollection | undefined; params: SearchParams; separator: string }): string {
  const filter = new FilterBuilder()

  if (!validateFilters(params)) {
    throw new Error("Invalid filters provided");
  }

  if (collection) {
    filter.where("collections.handle", collection.handle)
  }

  addCategoryFilters(filter, params.categories, separator)
  addArrayFilters(filter, {
    vendor: params.vendors,
    "flatOptions.Color": params.colors,
  })
  addPriceFilters(filter, params.minPrice, params.maxPrice)
  addRatingFilter(filter, params.rating)

  return filter.build(LogicalOperators.And)
}

function addCategoryFilters(filter: FilterBuilder, categories: string[], separator: string): void {
  if (categories.length === 0) return

  const categoryFilters = categories.map((category) => {
    const level = Math.min(category.split(separator).length - 1, 2)
    return `hierarchicalCategories.lvl${level}:"${category}"`
  })

  filter.raw(`(${categoryFilters.join(" OR ")})`)
}

function addArrayFilters(filter: FilterBuilder, fields: Record<string, string[]>): void {
  Object.entries(fields).forEach(([field, values]) => {
    if (values.length > 0) {
      filter.multi(field, values)
    }
  })
}

function addPriceFilters(filter: FilterBuilder, minPrice: number | null, maxPrice: number | null): void {
  if (!minPrice && !maxPrice) return

  if (minPrice) {
    filter.numeric("minPrice", minPrice, ComparisonOperators.GreaterThanOrEqual)
  }

  if (maxPrice) {
    filter.numeric("minPrice", maxPrice, ComparisonOperators.LessThanOrEqual)
  }
}

function addRatingFilter(filter: FilterBuilder, rating: number | null): void {
  if (rating && rating > 0) {
    filter.numeric("avgRating", rating, ComparisonOperators.GreaterThanOrEqual)
  }
}

