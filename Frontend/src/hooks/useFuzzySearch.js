import { useMemo } from "react";
import Fuse from "fuse.js";

// Default Fuse.js options optimized for restaurant menu search
const DEFAULT_OPTIONS = {
  // Keys to search in - weighted by importance
  keys: [
    { name: "name", weight: 0.6 },
    { name: "description", weight: 0.3 },
    { name: "categoryName", weight: 0.1 },
  ],
  // Threshold: 0 = exact match, 1 = match anything
  // 0.4 allows for typos like "caesa sald" -> "Caesar Salad"
  threshold: 0.4,
  // Include score in results for debugging/sorting
  includeScore: true,
  // Include matches for highlighting (optional)
  includeMatches: true,
  // Minimum characters before fuzzy search kicks in
  minMatchCharLength: 2,
  // Search in values that are longer than this
  ignoreLocation: true,
  // Use extended search patterns
  useExtendedSearch: false,
  // Find individual words from pattern
  findAllMatches: true,
  // Sort by score
  sortFn: (a, b) => a.score - b.score,
};

/**
 * Custom hook for fuzzy search using Fuse.js
 * @param {Array} items - Array of items to search through
 * @param {string} searchTerm - The search query
 * @param {Object} options - Fuse.js options
 * @returns {Object} - { results, fuse }
 */
const useFuzzySearch = (items, searchTerm, options = {}) => {
  const fuseOptions = useMemo(
    () => ({ ...DEFAULT_OPTIONS, ...options }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(options)],
  );

  // Create Fuse instance - memoized for performance
  const fuse = useMemo(() => {
    if (!items || items.length === 0) return null;
    return new Fuse(items, fuseOptions);
  }, [items, fuseOptions]);

  // Perform search - memoized
  const results = useMemo(() => {
    // If no search term or empty, return all items
    if (!searchTerm || searchTerm.trim() === "") {
      return items || [];
    }

    // If no fuse instance, return items
    if (!fuse) {
      return items || [];
    }

    // Perform fuzzy search
    const searchResults = fuse.search(searchTerm.trim());

    // Return just the items (without score/matches metadata)
    return searchResults.map((result) => result.item);
  }, [fuse, searchTerm, items]);

  return {
    results,
    fuse,
    hasSearchTerm: searchTerm && searchTerm.trim() !== "",
  };
};

export default useFuzzySearch;
