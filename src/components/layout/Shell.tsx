"use client";

import Link from "next/link";
import Image from "next/image";
import logo from "@/assets/logo.png";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { useDataStore } from "@/store/dataStore";
import { LoginModal } from "./LoginModal";
import { ThemeToggle } from "./ThemeToggle";
import { FilterBar } from "./FilterBar";

const NAV = [
  { href: "/", label: "Executive" },
  { href: "/accuracy", label: "Accuracy" },
  { href: "/category", label: "Category Analysis" },
  { href: "/technicians", label: "Technicians" },
  { href: "/supervisors", label: "Supervisors" },
  { href: "/sites", label: "Sites" },
  { href: "/auditors", label: "Auditors" },
  { href: "/coaching", label: "Coaching" },
  { href: "/data", label: "Data Table" },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const isAdmin = useAuthStore((s) => s.isAdmin);
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const lastUpload = useDataStore((s) => s.lastUpload);

  const latestUploadDate = Object.values(lastUpload)
    .map((u) => u?.uploaded_at)
    .filter((v): v is string => !!v)
    .sort()
    .reverse()[0];

  return (
    <div className="flex min-h-screen">
      <aside
        className={`no-print flex flex-col border-r border-card-border transition-all ${
          collapsed ? "w-16" : "w-56"
        }`}
      >
        <div className="flex items-center gap-2 px-4 py-4">
          <Image
            src={logo}
            alt="OptumRx GLP-1 Chart Checker"
            width={28}
            height={28}
            className="h-7 w-7 flex-shrink-0 rounded-md object-cover"
          />
          {!collapsed && (
            <div className="leading-tight">
              <p className="text-xs font-medium text-muted">OptumRx</p>
              <p className="text-sm font-semibold">Chart Checker</p>
            </div>
          )}
        </div>
        <nav className="flex-1 space-y-0.5 px-2">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
                  active
                    ? "bg-accent/15 font-medium text-accent"
                    : "text-muted hover:bg-accent/10 hover:text-foreground"
                }`}
              >
                {collapsed ? item.label.slice(0, 2) : item.label}
              </Link>
            );
          })}
          {isAdmin && (
            <Link
              href="/admin/upload"
              className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
                pathname === "/admin/upload"
                  ? "bg-accent/15 font-medium text-accent"
                  : "text-muted hover:bg-accent/10 hover:text-foreground"
              }`}
            >
              {collapsed ? "Up" : "Upload Data"}
            </Link>
          )}
        </nav>
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className="m-2 rounded-lg px-2 py-1.5 text-xs text-muted hover:bg-accent/10"
        >
          {collapsed ? "»" : "« Collapse"}
        </button>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="no-print flex flex-wrap items-center justify-between gap-3 border-b border-card-border px-4 py-3 sm:px-6">
          <div className="text-xs text-muted">
            {latestUploadDate
              ? `Latest upload: ${new Date(latestUploadDate).toLocaleString()}`
              : "No data uploaded yet"}
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {isAdmin ? (
              <div className="flex items-center gap-2 text-xs">
                <span className="hidden text-muted sm:inline">{user?.email}</span>
                <button
                  type="button"
                  onClick={() => signOut()}
                  className="rounded-lg border border-card-border px-3 py-1.5 hover:border-accent"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setLoginOpen(true)}
                className="rounded-lg border border-card-border px-3 py-1.5 text-xs hover:border-accent"
              >
                Admin Login
              </button>
            )}
          </div>
        </header>
        <FilterBar />
        <main className="flex-1 overflow-x-hidden p-4 sm:p-6">{children}</main>
      </div>

      {loginOpen && <LoginModal onClose={() => setLoginOpen(false)} />}
    </div>
  );
}
