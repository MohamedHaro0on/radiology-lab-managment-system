import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { debounce } from 'lodash';
import {
  Box,
  TextField,
  InputAdornment,
  IconButton,
  CircularProgress,
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';

/**
 * @typedef {Object} SearchBarProps
 * @property {function(string): void} onSearch - Callback when search value changes
 * @property {string} [placeholder] - Placeholder text for the search input
 * @property {boolean} [loading=false] - Whether the search is in loading state
 * @property {string} [initialValue=''] - Initial search value
 * @property {number} [debounceMs=300] - Debounce delay in milliseconds
 */

/**
 * A reusable search bar component with debouncing
 * @param {SearchBarProps} props
 */
const SearchBar = ({
  onSearch,
  placeholder,
  loading = false,
  initialValue = '',
  debounceMs = 300,
}) => {
  const { t } = useTranslation();
  const [value, setValue] = useState(initialValue);

  // Debounce the search callback
  const debouncedSearch = useCallback(
    debounce((searchValue) => {
      onSearch(searchValue);
    }, debounceMs),
    [onSearch, debounceMs]
  );

  const handleChange = (event) => {
    const newValue = event.target.value;
    setValue(newValue);
    debouncedSearch(newValue);
  };

  const handleClear = () => {
    setValue('');
    onSearch('');
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 500, mx: 'auto', mb: 3 }}>
      <TextField
        fullWidth
        variant="outlined"
        placeholder={placeholder || t('common.search')}
        value={value}
        onChange={handleChange}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon color="action" />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              {loading ? (
                <CircularProgress size={20} />
              ) : value ? (
                <IconButton
                  size="small"
                  onClick={handleClear}
                  aria-label="clear search"
                >
                  <ClearIcon />
                </IconButton>
              ) : null}
            </InputAdornment>
          ),
        }}
      />
    </Box>
  );
};

export default SearchBar; 