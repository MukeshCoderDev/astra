import { Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import Layout from '../components/layout/Layout';
import { Loading } from '../components/ui';
import { ErrorBoundary } from '../components/ui/error-boundary';

// Lazy load page components for code splitting
const Home = lazy(() => import('../pages/Home/Home'));
const Shorts = lazy(() => import('../pages/Shorts/Shorts'));
const Watch = lazy(() => import('../pages/Watch/Watch'));
const Upload = lazy(() => import('../pages/Upload/Upload'));
const Wallet = lazy(() => import('../pages/Wallet/Wallet'));
const Studio = lazy(() => import('../pages/Studio/Studio'));
const Profile = lazy(() => import('../pages/Profile/Profile'));
const Search = lazy(() => import('../pages/Search/Search'));
const Legal = lazy(() => import('../pages/Legal/Legal'));
const ProfileRoute = lazy(() => import('../components/routing/ProfileRoute'));
const LiveHome = lazy(() => import('../pages/Live/LiveHome'));
const LiveWatch = lazy(() => import('../pages/Live/LiveWatch'));

// Content Discovery Pages
const Subscriptions = lazy(() => import('../pages/Discovery/Subscriptions'));
const Explore = lazy(() => import('../pages/Discovery/Explore'));
const Trending = lazy(() => import('../pages/Discovery/Trending'));
const History = lazy(() => import('../pages/Discovery/History'));
const Playlists = lazy(() => import('../pages/Discovery/Playlists'));
const PlaylistDetail = lazy(() => import('../pages/Discovery/PlaylistDetail'));
const PlaylistCreate = lazy(() => import('../pages/Discovery/PlaylistCreate'));
const YourVideos = lazy(() => import('../pages/Discovery/YourVideos'));
const WatchLater = lazy(() => import('../pages/Discovery/WatchLater'));
const Liked = lazy(() => import('../pages/Discovery/Liked'));
const Downloads = lazy(() => import('../pages/Discovery/Downloads'));

// Loading fallback component
function PageLoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <Loading />
    </div>
  );
}

// Wrapper component for lazy-loaded routes
function LazyRoute({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoadingFallback />}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={
          <LazyRoute>
            <Home />
          </LazyRoute>
        } />
        <Route path="shorts" element={
          <LazyRoute>
            <Shorts />
          </LazyRoute>
        } />
        <Route path="shorts/:videoId" element={
          <LazyRoute>
            <Shorts />
          </LazyRoute>
        } />
        <Route path="live" element={
          <LazyRoute>
            <LiveHome />
          </LazyRoute>
        } />
        <Route path="live/:id" element={
          <LazyRoute>
            <LiveWatch />
          </LazyRoute>
        } />
        <Route path="watch/:id" element={
          <LazyRoute>
            <Watch />
          </LazyRoute>
        } />
        <Route path="search" element={
          <LazyRoute>
            <Search />
          </LazyRoute>
        } />
        <Route path="subscriptions" element={
          <LazyRoute>
            <Subscriptions />
          </LazyRoute>
        } />
        <Route path="explore" element={
          <LazyRoute>
            <Explore />
          </LazyRoute>
        } />
        <Route path="trending" element={
          <LazyRoute>
            <Trending />
          </LazyRoute>
        } />
        <Route path="history" element={
          <LazyRoute>
            <History />
          </LazyRoute>
        } />
        <Route path="playlists" element={
          <LazyRoute>
            <Playlists />
          </LazyRoute>
        } />
        <Route path="playlists/new" element={
          <LazyRoute>
            <PlaylistCreate />
          </LazyRoute>
        } />
        <Route path="playlists/:id" element={
          <LazyRoute>
            <PlaylistDetail />
          </LazyRoute>
        } />
        <Route path="your-videos" element={
          <LazyRoute>
            <YourVideos />
          </LazyRoute>
        } />
        <Route path="watch-later" element={
          <LazyRoute>
            <WatchLater />
          </LazyRoute>
        } />
        <Route path="liked" element={
          <LazyRoute>
            <Liked />
          </LazyRoute>
        } />
        <Route path="downloads" element={
          <LazyRoute>
            <Downloads />
          </LazyRoute>
        } />
        <Route path="upload" element={
          <LazyRoute>
            <Upload />
          </LazyRoute>
        } />
        <Route path="wallet" element={
          <LazyRoute>
            <Wallet />
          </LazyRoute>
        } />
        <Route path="studio/*" element={
          <LazyRoute>
            <Studio />
          </LazyRoute>
        } />
        <Route path="profile/:handle" element={
          <LazyRoute>
            <Profile />
          </LazyRoute>
        } />
        <Route path="legal/*" element={
          <LazyRoute>
            <Legal />
          </LazyRoute>
        } />
        <Route path="*" element={
          <LazyRoute>
            <ProfileRoute />
          </LazyRoute>
        } />
      </Route>
    </Routes>
  );
}

export default AppRoutes;