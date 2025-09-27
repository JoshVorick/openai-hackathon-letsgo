import { Sidebar, SidebarContent, SidebarProvider } from "@/components/ui/sidebar";
import Link from "next/link";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <Sidebar className="w-64 border-r bg-gray-50">
          <SidebarContent>
            <div className="p-4">
              <h2 className="text-xl font-bold mb-4">Hotel Admin</h2>
              <nav className="space-y-2">
                <Link 
                  href="/admin/overview" 
                  className="block p-2 rounded hover:bg-gray-200 font-medium"
                >
                  Overview
                </Link>
                <Link 
                  href="/admin/rooms" 
                  className="block p-2 rounded hover:bg-gray-200 text-gray-600"
                >
                  Rooms
                </Link>
                <Link 
                  href="/admin/rates" 
                  className="block p-2 rounded hover:bg-gray-200 text-gray-600"
                >
                  Rates
                </Link>
                <Link 
                  href="/admin/reservations" 
                  className="block p-2 rounded hover:bg-gray-200 text-gray-600"
                >
                  Reservations
                </Link>
              </nav>
            </div>
          </SidebarContent>
        </Sidebar>
        <main className="flex-1">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}