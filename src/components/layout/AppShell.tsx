// AppShell.tsx
import { useState, useRef, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { TopBar } from "./TopBar";
import { clearStoredAuth } from "@/lib/authStorage";

const SESSION_TIMEOUT_MS = 240 * 60 * 60 * 1000; // 240 hours inactivity → logout (matches token expiry)
const CHECK_INTERVAL_MS = 60 * 1000; // check every minute

function useSessionTimeout() {
  const lastActivityRef = useRef(Date.now());

  useEffect(() => {
    const onActivity = () => {
      lastActivityRef.current = Date.now();
    };

    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    events.forEach((e) => window.addEventListener(e, onActivity));

    const interval = setInterval(() => {
      if (Date.now() - lastActivityRef.current >= SESSION_TIMEOUT_MS) {
        clearStoredAuth();
        window.location.reload();
      }
    }, CHECK_INTERVAL_MS);

    return () => {
      events.forEach((e) => window.removeEventListener(e, onActivity));
      clearInterval(interval);
    };
  }, []);
}

export function AppShell() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  useSessionTimeout();

  return (
    <div className="h-screen flex w-full bg-background overflow-hidden">
      <AppSidebar
        collapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
      />
      <div className="flex-1 flex flex-col min-w-0 h-full">
        <TopBar />
        <main className="flex-1 overflow-y-auto custom-scrollbar">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
