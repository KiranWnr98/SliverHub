import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import '../layouts/portal.css';

interface Props {
  title: string;
  admin?: boolean;
}

export default function PortalPlaceholder({ title, admin = false }: Props) {
  return (
    <section className="portal-placeholder">
      <span className="portal-eyebrow">{admin ? 'ADMIN STUDIO' : 'YOUR ACCOUNT'}</span>
      <h1>{title}</h1>
      <p>{admin ? 'This section is part of the Silver Hub admin portal foundation and is ready for its next implementation milestone.' : 'This account section is ready for its next implementation milestone.'}</p>
      <Link to={admin ? '/admin/dashboard' : '/account'}><ArrowLeft size={16} /> {admin ? 'Back to dashboard' : 'Back to account'}</Link>
      {!admin && <Link to="/shop" className="placeholder-secondary">Continue shopping <ArrowUpRight size={15} /></Link>}
    </section>
  );
}
