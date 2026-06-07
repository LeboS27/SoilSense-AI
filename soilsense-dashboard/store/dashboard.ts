import { create } from "zustand";

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  variant: "success" | "error" | "info" | "critical";
}

interface DashboardState {
  sidebarOpen: boolean;
  toasts: ToastItem[];
  unreadAlerts: number;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  addToast: (toast: Omit<ToastItem, "id">) => void;
  removeToast: (id: string) => void;
  setUnreadAlerts: (count: number) => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  sidebarOpen: false,
  toasts: [],
  unreadAlerts: 0,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  addToast: (toast) =>
    set((s) => ({
      toasts: [...s.toasts, { ...toast, id: crypto.randomUUID() }],
    })),
  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  setUnreadAlerts: (count) => set({ unreadAlerts: count }),
}));
