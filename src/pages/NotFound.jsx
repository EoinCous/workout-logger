import { Link } from 'react-router-dom';
import '../css/NotFound.css';

const NotFound = () => (
  <main className="not-found-page">
    <p className="not-found-code">404</p>
    <h1>Page not found</h1>
    <p>The page you’re looking for doesn’t exist or may have moved.</p>
    <Link className="not-found-link" to="/">
      Back to home
    </Link>
  </main>
);

export default NotFound;
