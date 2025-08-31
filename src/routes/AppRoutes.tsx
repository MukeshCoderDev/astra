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