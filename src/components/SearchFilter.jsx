import { useState } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CATEGORIES = ['All', 'Tech', 'Arts', 'Academic', 'Life Skills'];
const TYPES = ['All', 'Offering', 'Seeking'];

export const SearchFilter = ({
  onSearch,
  onFilterChange,
  universities = [],
  selectedUniversity: controlledUniversity = undefined,
  selectedCategory: controlledCategory = undefined,
  selectedType: controlledType = undefined,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [internalCategory, setInternalCategory] = useState('All');
  const [internalType, setInternalType] = useState('All');
  const [internalUniversity, setInternalUniversity] = useState('All');
  const [showFilters, setShowFilters] = useState(false);

  const selectedCategory = controlledCategory !== undefined ? controlledCategory : internalCategory;
  const selectedType = controlledType !== undefined ? controlledType : internalType;
  const selectedUniversity = controlledUniversity !== undefined ? controlledUniversity : internalUniversity;

  const handleSearchChange = (value) => {
    setSearchQuery(value);
    onSearch(value);
  };

  const handleCategoryChange = (category) => {
    if (controlledCategory === undefined) setInternalCategory(category);
    onFilterChange({ category, type: selectedType, university: selectedUniversity });
  };

  const handleTypeChange = (type) => {
    if (controlledType === undefined) setInternalType(type);
    onFilterChange({ category: selectedCategory, type, university: selectedUniversity });
  };

  const handleUniversityChange = (university) => {
    if (controlledUniversity === undefined) setInternalUniversity(university);
    onFilterChange({ category: selectedCategory, type: selectedType, university });
  };

  const clearFilters = () => {
    setSearchQuery('');
    if (controlledCategory === undefined) setInternalCategory('All');
    if (controlledType === undefined) setInternalType('All');
    if (controlledUniversity === undefined) setInternalUniversity('All');
    onSearch('');
    onFilterChange({ category: 'All', type: 'All', university: 'All' });
  };

  const hasActiveFilters = selectedCategory !== 'All' || selectedType !== 'All' || selectedUniversity !== 'All' || searchQuery;

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-theme-secondary" size={20} />
        <input
          type="text"
          placeholder="Search skills..."
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-full pl-12 pr-10 sm:pr-4 py-3.5 sm:py-4 glass rounded-xl text-theme placeholder:text-theme-secondary focus:outline-none focus:ring-2 focus:ring-accent-theme transition-all min-h-[48px] text-base"
        />
        {searchQuery && (
          <button
            onClick={() => handleSearchChange('')}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-theme-secondary hover:text-theme transition-colors"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Filter Toggle */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2 glass rounded-lg text-theme hover:bg-accent-theme/10 transition-colors"
        >
          <Filter size={18} />
          <span className="font-medium">Filters</span>
        </button>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="px-4 py-2 text-theme-secondary hover:text-theme transition-colors text-sm"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Filter Options */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="glass rounded-xl p-4 space-y-4 overflow-hidden"
          >
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-semibold text-theme mb-2">Category</label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((category) => (
                  <button
                    key={category}
                    onClick={() => handleCategoryChange(category)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      selectedCategory === category
                        ? 'bg-accent-theme text-white'
                        : 'glass text-theme hover:bg-accent-theme/10'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* Type Filter */}
            <div>
              <label className="block text-sm font-semibold text-theme mb-2">Type</label>
              <div className="flex flex-wrap gap-2">
                {TYPES.map((type) => (
                  <button
                    key={type}
                    onClick={() => handleTypeChange(type)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      selectedType === type
                        ? 'bg-accent-theme text-white'
                        : 'glass text-theme hover:bg-accent-theme/10'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* University / Campus Filter */}
            {universities.length > 1 && (
              <div>
                <label className="block text-sm font-semibold text-theme mb-2">Campus / Location</label>
                <div className="flex flex-wrap gap-2">
                  {universities.map((uni) => (
                    <button
                      key={uni}
                      onClick={() => handleUniversityChange(uni)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        selectedUniversity === uni
                          ? 'bg-accent-theme text-white'
                          : 'glass text-theme hover:bg-accent-theme/10'
                      }`}
                    >
                      {uni}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
