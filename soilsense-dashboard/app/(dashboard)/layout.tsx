import { Sidebar, MobileSidebarDrawer } from "@/components/layout/Sidebar";
import { PageTitle } from "@/components/layout/PageTitle";
import { ToastContainer } from "@/components/ui/Toast";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-surface-bg">
      <Sidebar />
      <MobileSidebarDrawer />
      <div className="flex-1 min-w-0 flex flex-col">
        <PageTitle />
        <main className="flex-1 px-4 sm:px-6 py-6">{children}</main>
      </div>
      <ToastContainer />
    </div>
  );
}
