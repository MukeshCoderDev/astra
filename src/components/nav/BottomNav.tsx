import { Link, useLocation } from 'react-router-dom';
import { Home, Play, Upload, Wallet, User } from 'lucide-react';
import { clsx } from 'clsx';

const navItems = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: Play, label: 'Shorts', path: '/shorts' },
  { icon: Upload, label: 'Upload', path: '/upload' },
  { icon: Wallet, label: 'Wallet', path: '/wallet' },
  { icon: User, label: 'Studio', path: '/studio' },
];

interface BottomNavProps {
  className?: string;
}

function BottomNav({ className }: BottomNavProps) {
  const location = useLocation();

  return (
    <nav className={clsx(
      "fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
      className
    )}>
      <div className="container flex justify-around px-2 py-2">
        {navItems.map(({ icon: Icon, label, path }) => {
          const isActive = location.pathname === path || 
            (path !== '/' && location.pathname.startsWith(path));
          
          return (
            <Link
              key={path}
              to={path}
              className={clsx(
                'flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-0 text-center',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon size={20} />
              <span className="text-xs font-medium truncate">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default BottomNav;