// Reset password page bypasses the admin sidebar layout
export default function ResetPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactNode {
  return children;
}
