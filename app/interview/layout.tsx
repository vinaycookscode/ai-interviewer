export default function InterviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <main className="container mx-auto px-4 py-8 h-screen flex flex-col">
        {children}
      </main>
    </div>
  );
}
