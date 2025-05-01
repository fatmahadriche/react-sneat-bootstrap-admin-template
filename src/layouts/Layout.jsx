import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/authContext';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import Footer from './Footer';
import Loader from '../components/Loader';

const Layout = ({ children }) => {
  const [isMounted, setIsMounted] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      setIsMounted(true);
      // Initialisez ici les scripts nécessaires
    }
  }, [user]);

  if (!isMounted) {
    return <Loader />;
  }

  return (
    <div className="layout-wrapper layout-content-navbar">
      <div className="layout-container">
        <Sidebar />
        <div className="layout-page">
          <Navbar />
          <div className="content-wrapper">
            <div className="container-xxl flex-grow-1 container-p-y">
              {children}
            </div>
            <Footer />
          </div>
        </div>
        <div className="layout-overlay layout-menu-toggle"></div>
      </div>
    </div>
  );
};

export default Layout;