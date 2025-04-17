import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin - Exit Wounds',
  description: 'Pannello di amministrazione per Exit Wounds',
};

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div>
      {children}
    </div>
  );
} 