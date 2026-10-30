import '../css/SearchInput.css';

const SearchInput = ({ value, onChange, placeholder = 'Search exercises...' }) => {
  return (
    <input
      type="text"
      aria-label="Search exercises"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`search-input`}
    />
  );
};

export default SearchInput;