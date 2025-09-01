import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Play, 
  Upload, 
  Wallet, 
  User, 
  Radio, 
  Users, 
  Compass, 
  TrendingUp, 
  History, 
  ListVideo, 
  Clock, 
  Heart, 
  Video,
  Download
} from 'lucide-react';
import { Button } from '../ui';
import { RovingTabIndex } from '../ui/focus-management';
import { clsx } from 'clsx';
import { ENV } from '../../lib/env';

const getNavItems = () => {
  const mainNavItems = [
    { icon: Home, label: 'Home', path: '/', description: 'Go to home page' },
    { icon: Play, label: 'Shorts', path: '/shorts', description: 'Watch short videos' },
  ];

  // Add Live link if live streaming is enabled
  if (ENV.LIVE_ENABLED) {
    mainNavItems.push({ icon: Radio, label: 'Live', path: '/live', description: 'Watch live streams' });
  }

  mainNavItems.push(
    { icon: Users, label: 'Subscriptions', path: '/subscriptions', description: 'Videos from subscribed channels' },
    { icon: Compass, label: 'Explore', path: '/explore', description: 'Discover new content' },
    { icon: TrendingUp, label: 'Trending', path: '/trending', description: 'Popular videos right now' }
  );

  const youNavItems = [
    { icon: History, label: 'History', path: '/history', description: 'Your viewing history' },
    { icon: ListVideo, label: 'Playlists', path: '/playlists', description: 'Your saved playlists' },
    { icon: Video, label: 'Your videos', path: '/your-videos', description: 'Videos you uploaded' },
    { icon: Clock, label: 'Watch later', path: '/watch-later', description: 'Videos saved for later' },
    { icon: Heart, label: 'Liked videos', path: '/liked', description: 'Videos you liked' },
    { icon: Download, label: 'Downloads', path: '/downloads', description: 'Offline downloads' }
  ];

  const otherNavItems = [
    { icon: Upload, label: 'Upload', path: '/upload', description: 'Upload a new video' },
    { icon: Wallet, label: 'Wallet', path: '/wallet', description: 'Manage your wallet' },
    { icon: User, label: 'Studio', path: '/studio', description: 'Creator studio' }
  ];

  return { mainNavItems, youNavItems, otherNavItems };
};

interface SideNavProps {
  className?: string;
}

function SideNav({ className }: SideNavProps) {
  const location = useLocation();
  const { mainNavItems, youNavItems, otherNavItems } = getNavItems();

  const renderNavSection = (items: typeof mainNavItems, title?: string, sectionId?: string) => (
    <div className="space-y-1" role="group" aria-labelledby={sectionId}>
      {title && (
        <h3 
          id={sectionId}
          className="px-3 py-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider"
        >
          {title}
        </h3>
      )}
      <RovingTabIndex orientation="vertical">
        {items.map(({ icon: Icon, label, path, description }) => {
          const isActive = location.pathname === path || 
            (path !== '/' && location.pathname.startsWith(path));
          
          return (
            <Button
              key={path}
              variant={isActive ? "default" : "ghost"}
              className={clsx(
                "w-full justify-start gap-3 h-auto py-3 px-3",
                "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                isActive && "bg-primary text-primary-foreground"
              )}
              asChild
              role="menuitem"
              aria-current={isActive ? 'page' : undefined}
              aria-describedby={`${path}-desc`}
            >
              <Link to={path}>
                <Icon size={20} aria-hidden="true" />
                <span className="font-medium">{label}</span>
                <span id={`${path}-desc`} className="sr-only">{description}</span>
              </Link>
            </Button>
          );
        })}
      </RovingTabIndex>
    </div>
  );

  return (
    <nav 
      className={clsx("flex flex-col gap-6 p-4", className)}
      role="navigation"
      aria-label="Main navigation"
    >
      {renderNavSection(mainNavItems, undefined, 'main-nav')}
      <hr className="border-border" role="separator" />
      {renderNavSection(youNavItems, "You", "you-nav")}
      <hr className="border-border" role="separator" />
      {renderNavSection(otherNavItems, undefined, 'other-nav')}
    </nav>
  );
}

export default SideNav;