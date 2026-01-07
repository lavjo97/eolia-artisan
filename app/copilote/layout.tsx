export default function CopiloteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen overflow-hidden bg-[#0f1419]">
      {children}
    </div>
  );
}
