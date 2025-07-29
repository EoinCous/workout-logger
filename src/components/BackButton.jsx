import { useNavigate } from 'react-router-dom';
import '../css/BackButton.css';

const BackButton = ( {previousPage} ) => {
  const navigate = useNavigate();

  return (
    <button className="back-button" onClick={() => navigate(previousPage)}>
      &lt;
    </button>
  );
};

export default BackButton;