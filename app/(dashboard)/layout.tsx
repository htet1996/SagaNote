"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  LayoutGrid,
  Mic,
  FileAudio,
  Bot,
  StickyNote,
  Boxes,
  CreditCard,
  Settings,
  HelpCircle,
  LogOut,
  Menu,
  X,
  Plus,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUserStore } from "@/lib/store";
import { Logo, LogoMark } from "@/components/shared/Logo";
import { LoadingDots } from "@/components/ui/spinner";
import { formatDuration } from "@/lib/utils";
import type { UserProfile } from "@/types";

const NAV = [
  { label: "Overview", href: "/dashboard", icon: LayoutGrid },
  { label: "Recorder", href: "/recorder", icon: Mic },
  { label: "Transcriptions", href: "/transcriptions", icon: FileAudio },
  { label: "AI Agent", href: "/agent", icon: Bot },
  { label: "Notes", href: "/notes", icon: StickyNote },
  { label: "Workspace", href: "/workspace", icon: Boxes },
  { label: "Credits", href: "/credits", icon: CreditCard },
  { label: "Settings", href: "/settings", icon: Settings },
  { label: "Help", href: "/help", icon: HelpCircle },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, setProfile, loading, setLoading } = useUserStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Hydrate the user profile once.
  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login");
        return;
      }
      const { data } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();
      if (data) setProfile(data as UserProfile);
      setLoading(false);
    };
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close the mobile drawer on navigation.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
  };

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  const credits = profile?.credits_balance ?? 0;

  const SidebarContent = (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        padding: "20px 16px",
      }}
    >
      {/* Logo */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingLeft: 4,
        }}
      >
        <Link href="/dashboard">
          <Logo size={28} className="logo-invert-dark" />
        </Link>
        <button
          onClick={() => setMobileOpen(false)}
          className="sidebar-close"
          style={{
            display: "none",
            background: "transparent",
            border: "none",
            color: "inherit",
          }}
          aria-label="Close menu"
        >
          <X size={20} />
        </button>
      </div>

      {/* Credits badge */}
      <div
        style={{
          marginTop: 20,
          padding: 14,
          borderRadius: 12,
          background: "var(--color-primary)",
          color: "#fff",
        }}
      >
        <div
          style={{
            fontSize: "0.6875rem",
            color: "rgba(255,255,255,0.6)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          Credits balance
        </div>
        <div
          style={{
            fontSize: "1.5rem",
            fontWeight: 600,
            marginTop: 2,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {formatDuration(credits)}
        </div>
        <button
          onClick={() => router.push("/credits")}
          style={{
            marginTop: 10,
            width: "100%",
            height: 32,
            borderRadius: 8,
            border: "none",
            background: "#fff",
            color: "#111",
            fontSize: "0.75rem",
            fontWeight: 600,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          <Plus size={13} /> Top up
        </button>
      </div>

      {/* Menu */}
      <div
        style={{
          marginTop: 22,
          fontSize: "0.625rem",
          fontWeight: 600,
          letterSpacing: "0.08em",
          color: "var(--color-text-3)",
          paddingLeft: 12,
        }}
      >
        MENU
      </div>
      <nav
        className="thin-scrollbar"
        style={{
          marginTop: 8,
          display: "flex",
          flexDirection: "column",
          gap: 2,
          overflowY: "auto",
          flex: 1,
        }}
      >
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 11,
                padding: "9px 12px",
                borderRadius: 8,
                fontSize: "0.875rem",
                fontWeight: active ? 500 : 400,
                background: active ? "var(--color-primary)" : "transparent",
                color: active ? "#fff" : "var(--color-text-2)",
                transition: "background 0.12s ease",
              }}
              onMouseOver={(e) => {
                if (!active)
                  e.currentTarget.style.background = "var(--color-hover-light)";
              }}
              onMouseOut={(e) => {
                if (!active) e.currentTarget.style.background = "transparent";
              }}
            >
              <Icon size={17} strokeWidth={active ? 2.2 : 1.8} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div
        style={{
          marginTop: 14,
          paddingTop: 14,
          borderTop: "1px solid var(--color-border-light)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {profile?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatar_url}
              alt=""
              width={34}
              height={34}
              style={{ borderRadius: "50%", objectFit: "cover" }}
              referrerPolicy="no-referrer"
            />
          ) : (
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                background: "var(--color-secondary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.8125rem",
                fontWeight: 600,
              }}
            >
              {(profile?.full_name || profile?.email || "U")
                .charAt(0)
                .toUpperCase()}
            </div>
          )}
          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                fontSize: "0.8125rem",
                fontWeight: 500,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {profile?.full_name || "User"}
            </div>
            <div
              style={{
                fontSize: "0.6875rem",
                color: "var(--color-text-3)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {profile?.email}
            </div>
          </div>
          <button
            onClick={signOut}
            aria-label="Sign out"
            style={{
              background: "transparent",
              border: "none",
              color: "var(--color-text-3)",
              padding: 6,
              borderRadius: 6,
            }}
            onMouseOver={(e) =>
              (e.currentTarget.style.color = "var(--color-text-1)")
            }
            onMouseOut={(e) =>
              (e.currentTarget.style.color = "var(--color-text-3)")
            }
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 20,
          color: "var(--color-text-2)",
        }}
      >
        <LogoMark size={46} className="logo-invert-dark" />
        <LoadingDots />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex" }}>
      {/* Desktop sidebar */}
      <aside
        className="desktop-sidebar"
        style={{
          width: 240,
          flexShrink: 0,
          borderRight: "1px solid var(--color-border-light)",
          background: "var(--color-white)",
          position: "sticky",
          top: 0,
          height: "100vh",
        }}
      >
        {SidebarContent}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <div
            onClick={() => setMobileOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.4)",
              backdropFilter: "blur(2px)",
              zIndex: 60,
            }}
          />
          <aside
            className="mobile-drawer"
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              bottom: 0,
              width: 260,
              background: "var(--color-white)",
              zIndex: 70,
              boxShadow: "4px 0 24px rgba(0,0,0,0.12)",
            }}
          >
            {SidebarContent}
          </aside>
        </>
      )}

      {/* Main column */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        {/* Mobile top bar */}
        <header
          className="mobile-topbar"
          style={{
            display: "none",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 16px",
            borderBottom: "1px solid var(--color-border-light)",
            background: "var(--color-white)",
            position: "sticky",
            top: 0,
            zIndex: 40,
          }}
        >
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            style={{
              background: "transparent",
              border: "none",
              color: "inherit",
              padding: 4,
            }}
          >
            <Menu size={22} />
          </button>
          <Logo size={26} className="logo-invert-dark" />
          <div style={{ width: 30 }} />
        </header>

        <main style={{ flex: 1, padding: "28px 28px 60px" }} className="main-pad">
          {children}
        </main>
      </div>
    </div>
  );
}
