import { useLocation, Navigate } from 'react-router-dom';
import Layout from '../layout/Layout';
import Profile from '../../pages/Profile/Profile';

function ProfileRoute() {
  const location = useLocation();
  
  console.log('ProfileRoute - pathname:', location.pathname);
  
  // Check if this is actually a profile route (starts with /@)
  if (!location.pathname.startsWith('/@')) {
    return <Navigate to="/" replace />;
  }
  
  // Extract handle from pathname (remove /@ prefix)
  const handle = location.pathname.slice(2);
  console.log('ProfileRoute - extracted handle:', handle);
  
  // Wrap Profile in Layout since this route is outside the Layout route
  return (
    <Layout>
      <Profile />
    </Layout>
  );
}

export default ProfileRoute;