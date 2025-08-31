import { Link, useLocation } from 'react-router-dom';
import { Home, Play, Upload, Wallet, User } from 'lucide-react';
import { Button } from '../ui';
import { clsx } from 'clsx';

const navItems = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: Play, label: 'Shorts', path: '/shorts' },
  { icon: Upload, label: 'Upload', path: '/upload' },
  { icon: Wallet, label: 'Wallet', path: '/wallet' },
  { icon: User, label: 'Studio', path: '/studio' },
];

interface SideNavProps {
  className?: string;
}

function SideNav({ className }: SideNavProps) {
  const location = useLocation();

  return (
    <nav className={clsx("flex flex-col gap-2 p-4", className)}>
      {navItems.map(({ icon: Icon, label, path }) => {
        const isActive = location.pathname === path || 
          (path !== '/' && location.pathname.startsWith(path));
        
        return (
          <Button
            key={path}
            variant={isActive ? "default" : "ghost"}
            className={clsx(
              "justify-start gap-3 h-auto py-3",
              isActive && "bg-primary text-primary-foreground"
            )}
            asChild
          >
            <Link to={path}>
              <Icon size={20} />
              <span className="font-medium">{label}</span>
            </Link>
          </Button>
        );
      })}
    </nav>
  );
}

export default SideNav;