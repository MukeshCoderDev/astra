import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import Header from '../nav/Header';
import SideNav from '../nav/SideNav';
import BottomNav from '../nav/BottomNav';
import AgeGate from '../compliance/AgeGate';
import { GlobalNotifications } from '../notifications/GlobalNotifications';
import { Footer } from './Footer';
import { useUIStore } from '../../store/uiStore';
import { clsx } from 'clsx';

function Layout() {
  const { mobileMenuOpen, setMobileMenuOpen } = useUIStore();
  const [sidebarCollapsed] = useState(false);

  const handleMenuClick = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Age Gate Modal */}
      <AgeGate />
      
      {/* Global Notifications */}
      <GlobalNotifications />
      
      {/* Desktop Layout */}
      <div className="hidden lg:flex min-h-screen">
        {/* Sidebar */}
        <aside className={clsx(
          "border-r bg-card transition-all duration-300",
          sidebarCollapsed ? "w-16" : "w-64"
        )}>
          <div className="sticky top-0 h-screen overflow-y-auto">
            <SideNav className="h-full" />
          </div>
        </aside>
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          <Header 
            onMenuClick={handleMenuClick}
            showMenuButton={false}
          />
          <main className="flex-1 overflow-y-auto">
            <div className="container mx-auto px-4 py-6">
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