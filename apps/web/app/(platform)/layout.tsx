import Sidebar from "../components/Footer";

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-[#0f172a]">
      {/* The Sidebar (Fixed) */}
      <Sidebar />
      
      {/* The Main Content Area (Offset by sidebar width) */}
      <main className="flex-1 ml-64 p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}