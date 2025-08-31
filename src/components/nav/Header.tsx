import { Link } from 'react-router-dom';
import { Search, Upload, Menu } from 'lucide-react';
import { Button, Input, ThemeToggle, Avatar, AvatarFallback } from '../ui';
import { SkipLink, Landmark } from '../ui/screen-reader';
import { WalletBadge } from '../wallet/WalletBadge';
import { useWallet } from '../../hooks/useWallet';
import { useState } from 'react';

interface HeaderProps {
  onMenuClick?: () => void;
  showMenuButton?: boolean;
}

function Header({ onMenuClick, showMenuButton = false }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');
  
  const { balance, isLoadingBalance } = useWallet();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Navigate to search with query
      window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  return (
    <>
      <SkipLink href="#main-content">
        Skip to main content
      </SkipLink>
      <SkipLink href="#search">
        Skip to search
      </SkipLink>
      
      <Landmark role="banner">
        <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-16 items-center justify-between px-4">
        {/* Left section */}
        <div className="flex items-center gap-4">
          {showMenuButton && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onMenuClick}
              className="md:hidden"
              aria-label="Toggle navigation menu"
              aria-expanded="false"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </Button>
          )}
          
          {/* Logo */}
          <Link 
            to="/" 
            className="flex items-center gap-2"
            aria-label="Astra - Go to homepage"
          >
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center" aria-hidden="true">
              <span className="text-primary-foreground font-bold text-lg">A</span>
            </div>
            <span className="font-semibold text-xl">Astra</span>
          </Link>
        </div>

        {/* Search - Desktop */}
        <Landmark role="search" className="hidden md:flex items-center w-full max-w-md">
          <form onSubmit={handleSearch} className="flex w-full" role="search">
            <Input
              id="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search videos..."
              className="rounded-r-none border-r-0"
              aria-label="Search videos"
              autoComplete="off"
            />
            <Button
              type="submit"
              variant="outline"
              size="icon"
              className="rounded-l-none"
              aria-label="Submit search"
            >
              <Search className="h-4 w-4" aria-hidden="true" />
            </Button>
          </form>
        </Landmark>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Mobile search button */}
          <Button
            variant="ghost"
            size="icon"
            asChild
            className="md:hidden"
            aria-label="Go to search page"
          >
            <Link to="/search">
              <Search className="h-5 w-5" aria-hidden="true" />
            </Link>
          </Button>

          {/* Upload button */}
          <Button
            variant="outline"
            size="sm"
            asChild
            className="gap-2"
            aria-label="Upload video"
          >
            <Link to="/upload">
              <Upload className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Upload</span>
            </Link>
          </Button>

          {/* Wallet Badge */}
          <WalletBadge 
            balance={balance || {
              usdc: 1250.75,
              pendingEarnings: 45.20,
              availableForWithdraw: 1205.55,
              lastUpdated: new Date().toISOString()
            }}
            isLoading={isLoadingBalance}
            compact={true}
            className="hidden sm:flex"
          />

          {/* Theme toggle */}
          <ThemeToggle />
          
          {/* User avatar */}
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            aria-label="User menu"
          >
            <Avatar className="h-8 w-8">
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
          </Button>
        </div>
      </div>
    </header>
      </Landmark>
    </>
  );
}

export default Header;