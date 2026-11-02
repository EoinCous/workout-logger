import { useNavigate } from 'react-router-dom';
import '../css/BackButton.css';

const BackButton = ({ previousPage }) => {
  const navigate = useNavigate();

  return (
    <button
      className="back-button"
      type="button"
      aria-label="Go back"
      onClick={() => navigate(previousPage)}
    >
      <svg
        className="back-button__icon"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <path d="M19 12H5m0 0 7 7m-7-7 7-7" />
      </svg>
    </button>
  );
};

export default BackButton;