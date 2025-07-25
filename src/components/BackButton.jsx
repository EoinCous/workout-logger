import { useNavigate } from 'react-router-dom';
import '../css/BackButton.css';

const BackButton = ( {page} ) => {
  const navigate = useNavigate();

  return (
    <button className="back-button" onClick={() => navigate(page)}>
      &lt;
    </button>
  );
};

export default BackButton;