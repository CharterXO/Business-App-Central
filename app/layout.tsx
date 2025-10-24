import './styles/globals.css';

export const metadata = {
  title: 'Business App Central',
  description: 'Okta-style launcher without SSO',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
