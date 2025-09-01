import { Outlet, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Header from '../nav/Header';
import SideNav from '../nav/SideNav';
import BottomNav from '../nav/BottomNav';
import AgeRequirementCard from '../compliance/AgeRequirementCard';
import { GlobalNotifications } from '../notifications/GlobalNotifications';
import { AgeGateTest } from '../debug/AgeGateTest';
import { Footer } from './Footer';
import { useUIStore } from '../../store/uiStore';
import { clsx } from 'clsx';

function Layout() {
  const location = useLocation();
  const { mobileMenuOpen, setMobileMenuOpen, immersive, setImmersive } = useUIStore();
  const [sidebarCollapsed] = useState(false);

  const handleMenuClick = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  // Auto-immersive on watch, live, and shorts detail
  useEffect(() => {
    const pathname = location.pathname || '';
    const routeImmersive = pathname.startsWith('/watch') || pathname.startsWith('/live/') || /^\/shorts\//.test(pathname);
    
    if (routeImmersive) {
      // Route can force immersive ON
      setImmersive(true);
    } else {
      // Reset immersive mode when leaving watch/live/shorts routes
      setImmersive(false);
    }
  }, [location.pathname, setImmersive]);

  // Peek the sidebar when mouse hits far-left edge in immersive mode
  useEffect(() => {
    if (!immersive) return;
    
    const aside = document.querySelector('aside') as HTMLElement | null;
    if (!aside) return;
    
    const onMove = (e: MouseEvent) => {
      const peek = e.clientX <= 12;
      aside.style.transform = peek ? 'translateX(0)' : 'translateX(-100%)';
    };
    
    window.addEventListener('mousemove', onMove);
    
    return () => {
      window.removeEventListener('mousemove', onMove);
    };
  }, [immersive]);

  // Clean up transforms when leaving immersive mode
  useEffect(() => {
    if (!immersive) {
      const aside = document.querySelector('aside') as HTMLElement | null;
      if (aside) {
        aside.style.transform = '';
      }
    }
  }, [immersive]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Age Gate Modal */}
      <AgeRequirementCard />
      
      {/* Debug Component - Remove in production */}
      <AgeGateTest />
      
      {/* Global Notifications */}
      <GlobalNotifications />
      
      {/* Desktop Layout */}
      <div className="hidden lg:flex min-h-screen">
        {/* Sidebar */}
        <aside className={clsx(
          "fixed left-0 top-0 z-40 h-screen border-r bg-card transition-transform duration-200",
          sidebarCollapsed ? "w-16" : "w-64",
          immersive ? "-translate-x-full" : "translate-x-0"
        )}>
          <div className="sticky top-0 h-screen overflow-y-auto">
            <SideNav className="h-full" />
          </div>
        </aside>
        
        {/* Main Content */}
        <div className={clsx(
          "flex-1 flex flex-col min-w-0 transition-all duration-200",
          immersive ? "ml-0" : (sidebarCollapsed ? "ml-16" : "ml-64")
        )}>
          <Header 
            onMenuClick={handleMenuClick}
            showMenuButton={false}
          />
          <main className="flex-1 overflow-y-auto">
            <div className={clsx(
              "mx-auto px-4 py-6",
              immersive ? "container-fluid" : "container"
            )}>
              <Outlet />
            </div>
            <Footer />
          </main>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden flex flex-col min-h-screen">
        <Header 
          onMenuClick={handleMenuClick}
          showMenuButton={true}
        />
        
        {/* Mobile Sidebar Overlay */}
        {mobileMenuOpen && (
          <>
            <div 
              className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
            />
            <aside className="fixed left-0 top-16 bottom-0 z-50 w-64 bg-card border-r">
              <SideNav className="h-full" />
            </aside>
          </>
        )}
        
        <main className="flex-1 overflow-y-auto pb-16">
          <div className="container mx-auto px-4 py-6">
            <Outlet />
          </div>
          <Footer />
        </main>
        
        <BottomNav />
      </div>
    </div>
  );
}

export default Layout;