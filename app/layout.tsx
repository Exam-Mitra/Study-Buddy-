import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ExamMitra - Free Study Resources',
  description: 'Free batches, PDFs, videos, quizzes and study resources for students.',
  manifest: '/manifest.json'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="nav">
          <div className="container nav-inner">
            <a className="brand" href="/">Exam<span>Mitra</span></a>
            <nav className="nav-links">
              <a href="/">Home</a>
              <a href="/#materials">Materials</a>
              <a href="/credits">Credits</a>
              <a href="/contact">Contact</a>
              <a href="/admin">Admin</a>
            </nav>
          </div>
        </header>
        {children}
        <footer className="footer">
          <div className="container">
            <p><b>ExamMitra</b> is independently created and operated. <a href="/credits">Credits & acknowledgements</a></p>
            <p>Minimal ads only. If you are a copyright owner and have concerns, please use the <a href="/contact">contact/removal page</a>.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
