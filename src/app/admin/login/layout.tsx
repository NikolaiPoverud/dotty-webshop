// Login page has its own layout that bypasses auth check
export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
