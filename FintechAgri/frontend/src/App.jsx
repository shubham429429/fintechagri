import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import useAuthStore from './stores/authStore';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import CropMarket from './components/CropMarket';
import PriceForecast from './components/PriceForecast';
import FarmInventory from './components/FarmInventory';
import SocialHub from './components/SocialHub';
import NearbyMarkets from './components/NearbyMarkets';
import './index.css';

function App() {
  const { isAuthenticated, fetchUser, token } = useAuthStore();

  useEffect(() => {
    if (token) fetchUser();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />} />
        <Route path="/register" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Register />} />
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/dashboard" />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="market" element={<CropMarket />} />
          <Route path="forecast" element={<PriceForecast />} />
          <Route path="inventory" element={<FarmInventory />} />
          <Route path="social" element={<SocialHub />} />
          <Route path="nearby" element={<NearbyMarkets />} />
        </Route>
        <Route path="*" element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
