import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <h1>404 - Not Found</h1>
      <p>The page you are looking for does not exist.</p>
      <Link to="/" style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: 'var(--accent-primary)', color: 'white', borderRadius: 'var(--radius-md)' }}>
        Go Home
      </Link>
    </div>
  );
}
