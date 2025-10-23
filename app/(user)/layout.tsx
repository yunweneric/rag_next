export default async function UserLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Firebase Auth is handled client-side
  // No server-side authentication check needed
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}
