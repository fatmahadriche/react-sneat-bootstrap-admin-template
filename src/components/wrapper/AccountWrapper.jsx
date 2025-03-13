import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const navData = [
  { link: '/account/settings', name: 'Account', ariaLabel: 'Account settings' },
  { link: '/account/notifications', name: 'Notifications', ariaLabel: 'Notifications' },
];

const MenuItem = ({ link, name, ariaLabel }, index) => {
  const location = useLocation();
  const isActive = location.pathname === link;

  return (
    <li key={index} className="nav-item">
      <Link 
        className={`nav-link ${isActive ? 'active' : ''}`} 
        to={link} 
        aria-label={`Go to ${ariaLabel}`}
      >
        <i className="bx bx-user me-1"></i>{name}
      </Link>
    </li>
  );
};

export const AccountWrapper = ({ title, children }) => {
  return (
    <>
      <h4 className="py-3 mb-4">
        <span className="text-muted fw-light">Account Settings /</span> {title}
      </h4>

      <div className="row">
        <div className="col-md-12">
          <ul className="nav nav-pills flex-column flex-md-row mb-3">
            {navData.map((item, index) => (
              <MenuItem key={index} {...item} />
            ))}
          </ul>
          {children}
        </div>
      </div>
    </>
  );
};