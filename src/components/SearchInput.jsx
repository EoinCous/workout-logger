import '../css/SearchInput.css';

const SearchInput = ({ value, onChange }) => {
  return (
    <input
      type="text"
      placeholder="Search exercises..."
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`search-input`}
    />
  );
};

export default SearchInput;