// src/app/components/SharedLibraryModal.tsx // COMPLETE FILE REPLACEMENT

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { usePrompt } from '../hooks/usePrompt';
import { PromptComponentData } from '../context/PromptContext'; // Import type

// Type for items fetched from the library API
interface LibraryItem {
  id: string;
  name: string;
  description?: string;
  category: string;
  tags?: string[];
  components: PromptComponentData[];
  suggested_provider?: string;
  suggested_model?: string;
  // Add other fields from your DB schema if needed
}

interface SharedLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Icons
const LoadIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    className="w-4 h-4"
  >
    <path
      fillRule="evenodd"
      d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
      clipRule="evenodd"
    ></path>
  </svg>
);
const CloseButtonIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-6 h-6"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6 18 18 6M6 6l12 12"
    />
  </svg>
);

// Define categories (can be fetched later or kept hardcoded)
const CATEGORIES = [
  'All',
  'Content Creation',
  'Coding & Development',
  'Business & Marketing',
  'Productivity',
  'Agent Creation',
  'Education',
  'General Purpose',
];

export function SharedLibraryModal({
  isOpen,
  onClose,
}: SharedLibraryModalProps) {
  const {
    loadLibraryItemToCanvas, // Use the new context handler
  } = usePrompt();

  const [items, setItems] = useState<LibraryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [totalCount, setTotalCount] = useState(0); // For pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // Or make this configurable

  // --- FULL fetchLibraryItems LOGIC ---
  const fetchLibraryItems = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const offset = (currentPage - 1) * itemsPerPage;
      let apiUrl = `/api/library?limit=${itemsPerPage}&offset=${offset}`;
      if (selectedCategory && selectedCategory !== 'All') {
        apiUrl += `&category=${encodeURIComponent(selectedCategory)}`;
      }
      if (searchTerm.trim()) {
        apiUrl += `&search=${encodeURIComponent(searchTerm.trim())}`;
      }

      console.log(`[LibraryModal] Fetching: ${apiUrl}`);
      const response = await fetch(apiUrl);

      const data = await response.json();

      // *** ADD THIS DETAILED LOG ***
      console.log(
        '[LibraryModal] Raw API Response from /api/library:',
        JSON.stringify(data, null, 2)
      );
      // Specifically check data.items
      if (data && data.items && Array.isArray(data.items)) {
        console.log(
          '[LibraryModal] data.items is an array. First item (if any):',
          data.items[0] ? JSON.stringify(data.items[0], null, 2) : 'No items'
        );
        // Check if the first item has a components array
        if (data.items[0] && data.items[0].components) {
          console.log(
            "[LibraryModal] First item's components array:",
            data.items[0].components
          );
        } else if (data.items[0]) {
          console.error(
            "[LibraryModal] ERROR: First item from API is MISSING 'components' property!",
            data.items[0]
          );
        }
      } else {
        console.error(
          '[LibraryModal] ERROR: data.items from API is not an array or is missing!',
          data
        );
      }
      // *** END DETAILED LOG ***

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to fetch library items.');
      }

      setItems(data.items || []);
      setTotalCount(data.totalCount || 0);
    } catch (err: any) {
      console.error('Error fetching library items:', err);
      setError(err.message);
      setItems([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, selectedCategory, currentPage, itemsPerPage]);
  // --- END fetchLibraryItems LOGIC ---

  // Fetch items when modal opens or filters/page change
  useEffect(() => {
    if (isOpen) {
      fetchLibraryItems();
    }
  }, [isOpen, fetchLibraryItems]); // fetchLibraryItems is now a dependency

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory]);

  const handleLoadItem = (item: LibraryItem) => {
    // *** ADD THIS LOG ***
    console.log(
      '[LibraryModal] handleLoadItem called with item:',
      JSON.stringify(item, null, 2)
    );
    // Check if item.components exists here
    if (!item || !item.components || !Array.isArray(item.components)) {
      console.error(
        '[LibraryModal] ERROR: item.components is missing or invalid BEFORE calling context function!',
        item
      );
      alert('Library item data is incomplete. Cannot load.');
      return;
    }
    // *** END LOG & CHECK ***
    if (
      window.confirm(
        `Load "${item.name}" into the canvas? Current canvas will be replaced.`
      )
    ) {
      loadLibraryItemToCanvas({
        name: item.name,
        components: item.components,
        suggested_provider: item.suggested_provider,
        suggested_model: item.suggested_model,
      });
      onClose();
    }
  };

  if (!isOpen) return null;

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm dark:bg-opacity-75"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-4 sm:p-6 w-full max-w-3xl mx-4 h-[80vh] max-h-[700px] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
            Prompt Library
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 rounded-full"
            aria-label="Close modal"
          >
            <CloseButtonIcon />
          </button>
        </div>

        {/* Filters */}
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center gap-4">
          <input
            type="text"
            placeholder="Search library by name/description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-grow p-2 border border-gray-300 dark:border-gray-600 rounded shadow-sm text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:ring-indigo-500 focus:border-indigo-500"
          />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-gray-100 focus:ring-indigo-500 focus:border-indigo-500 min-w-[150px]"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Item List */}
        <div className="flex-grow overflow-y-auto pr-2 space-y-3">
          {' '}
          {/* Added pr-2 for scrollbar space */}
          {isLoading && (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">
              Loading library items...
            </p>
          )}
          {error && (
            <p className="text-red-500 dark:text-red-400 text-center py-4">
              Error: {error}
            </p>
          )}
          {!isLoading && !error && items.length === 0 && (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">
              No items found matching your criteria.
            </p>
          )}
          {!isLoading &&
            !error &&
            items.map((item) => (
              <div
                key={item.id}
                className="p-3 border border-gray-200 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700/60 hover:shadow-lg dark:hover:bg-gray-700 transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-grow mr-2">
                    <h3 className="font-semibold text-gray-800 dark:text-gray-100">
                      {item.name}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                      Category: {item.category}
                    </p>
                    <p
                      className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2"
                      title={item.description}
                    >
                      {item.description || 'No description available.'}
                    </p>
                    {item.tags && item.tags.length > 0 && (
                      <div className="mt-1">
                        {item.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-1.5 py-0.5 rounded-full mr-1 mb-1 inline-block"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleLoadItem(item)}
                    title={`Load "${item.name}" template`}
                    className="flex-shrink-0 ml-2 p-1.5 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/30 flex items-center"
                  >
                    <LoadIcon />{' '}
                    <span className="ml-1 text-xs hidden sm:inline">Load</span>
                  </button>
                </div>
              </div>
            ))}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && !isLoading && !error && (
          <div className="flex justify-center items-center space-x-2 pt-4 mt-auto border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="text-sm py-1 px-3 rounded bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="text-sm py-1 px-3 rounded bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}

        {/* Footer Close Button */}
        <div
          className={`mt-6 pt-4 ${totalPages <= 1 ? 'mt-auto border-t' : ''} border-gray-200 dark:border-gray-700 text-right`}
        >
          {' '}
          {/* Conditional border for better spacing if no pagination */}
          <button
            onClick={onClose}
            className="py-2 px-4 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-200 rounded transition duration-150 ease-in-out text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
