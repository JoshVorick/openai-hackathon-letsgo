import Link from "next/link";
import {
  Sidebar,
  SidebarContent,
  SidebarProvider,
} from "@/components/ui/sidebar";

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
              <h2 className="mb-4 font-bold text-xl">Hotel Admin</h2>
              <nav className="space-y-2">
                <Link
                  className="block rounded p-2 font-medium hover:bg-gray-200"
                  href="/admin/overview"
                >
                  Overview
                </Link>
                <Link
                  className="block rounded p-2 text-gray-600 hover:bg-gray-200"
                  href="/admin/rooms"
                >
                  Rooms
                </Link>
                <Link
                  className="block rounded p-2 text-gray-600 hover:bg-gray-200"
                  href="/admin/rates"
                >
                  Rates
                </Link>
                <Link
                  className="block rounded p-2 text-gray-600 hover:bg-gray-200"
                  href="/admin/reservations"
                >
                  Reservations
                </Link>
              </nav>
            </div>
          </SidebarContent>
        </Sidebar>
        <main className="flex-1">{children}</main>
      </div>
    </SidebarProvider>
  );
}
