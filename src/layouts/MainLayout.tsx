
import type { ReactNode } from 'react';
import AnnouncementBar from '../components/AnnouncementBar/AnnouncementBar';
import Navbar from '../components/Navbar/Navbar';
import Footer from '../components/Footer/Footer';

interface Props {
  children: ReactNode;
}

export default function MainLayout({ children }: Props) {
  return (
    <div className="website">
      <AnnouncementBar />
      <Navbar />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
