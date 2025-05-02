import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/authContext';
import menuData from '../data/menuData.json';

const Sidebar = () => {
  const { user } = useAuth();

  const generateDynamicLink = (link) => {
    if (!link || !user) return '#';
    return link
      .replace(/:role/gi, user.role.toLowerCase())
      .replace(/:matricule/gi, user.matricule || '');
  };

  // Nouvelle fonction de filtration récursive
  const filterMenuItems = (items) => {
    return items
      .filter(item => item.roles.map(r => r.toLowerCase()).includes(user?.role?.toLowerCase()))
      .map(item => ({
        ...item,
        link: item.link ? generateDynamicLink(item.link) : null,
        submenu: item.submenu ? filterMenuItems(item.submenu) : null
      }));
  };

  const filteredMenu = menuData
    .filter(section => section.roles.map(r => r.toLowerCase()).includes(user?.role?.toLowerCase()))
    .map(section => ({
      ...section,
      items: filterMenuItems(section.items)
    }));


  return (
    <aside id="layout-menu" className="layout-menu menu-vertical menu bg-menu-theme">
      <div className="app-brand demo">
        <span className="app-brand-link" style={{ cursor: 'default' }}>
          <span className="app-brand-logo demo">
            <img
              src="/assets/img/STEG.jpg"
              alt="STEG logo"
              aria-label="STEG logo image"
              style={{ width: 'auto', height: '40px' }}
            />
          </span>
          <span className="app-brand-text demo menu-text fw-bold ms-2" style={{ textTransform: 'uppercase' }}>
            STEG
          </span>
        </span>
        <a href="#" className="layout-menu-toggle menu-link text-large ms-auto d-block d-xl-none">
          <i className="bx bx-chevron-left bx-sm align-middle"></i>
        </a>
      </div>
      <div className="menu-inner-shadow"></div>

      <ul className="menu-inner py-1">
        {filteredMenu.map((section, index) => (
          <React.Fragment key={`section-${index}`}>
            {section.header && (
              <li className="menu-header small text-uppercase">
                <span className="menu-header-text">{section.header}</span>
              </li>
            )}
            {section.items.map((item) => (
              <MenuItem key={item.text} {...item} />
            ))}
          </React.Fragment>
        ))}
      </ul>
    </aside>
  );
};

const MenuItem = (item) => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [isSubmenuOpen, setIsSubmenuOpen] = useState(false);
  const hasSubmenu = item.submenu?.length > 0;
  
  // Vérification de l'état actif
  const isActive = hasSubmenu 
    ? item.submenu.some(sub => sub.link === location.pathname)
    : location.pathname === item.link;

  useEffect(() => {
    // Ouvre automatiquement le sous-menu si l'item est actif
    setIsSubmenuOpen(isActive);
  }, [location.pathname]);

  const toggleSubmenu = () => {
    if (hasSubmenu) {
      setIsSubmenuOpen(!isSubmenuOpen);
    }
  };

  const handleLogout = () => {
    if (item.text === "Déconnexion") logout();
  };

  if (hasSubmenu && item.submenu.length === 0) return null;

  return (
    <li className={`menu-item ${isActive ? 'active' : ''} ${isSubmenuOpen ? 'open' : ''}`}>
      {item.text === "Déconnexion" ? (
        <div 
          className="menu-link cursor-pointer" 
          onClick={handleLogout}
          role="button"
          tabIndex={0}
        >
          <i className={`menu-icon tf-icons ${item.icon}`}></i>
          <div>{item.text}</div>
        </div>
      ) : hasSubmenu ? (
        <div
          className={`menu-link menu-toggle ${isSubmenuOpen ? 'active' : ''}`}
          onClick={toggleSubmenu}
          role="button"
          tabIndex={0}
        >
          <i className={`menu-icon tf-icons ${item.icon}`}></i>
          <div>{item.text}</div>
          {item.available === false && (
            <div className="badge bg-label-primary fs-tiny rounded-pill ms-auto">Pro</div>
          )}
          
        </div>
      ) : (
        <NavLink
          to={item.link}
          className={({ isActive }) => 
            `menu-link ${isActive ? 'active' : ''}`
          }
          end
        >
          <i className={`menu-icon tf-icons ${item.icon}`}></i>
          <div>{item.text}</div>
          {item.available === false && (
            <div className="badge bg-label-primary fs-tiny rounded-pill ms-auto">Pro</div>
          )}
        </NavLink>
      )}
      
      {hasSubmenu && (
        <ul className="menu-sub" style={{ display: isSubmenuOpen ? 'block' : 'none' }}>
          {item.submenu
            .filter(subItem => subItem.roles.map(r => r.toLowerCase()).includes(user.role.toLowerCase()))
            .map((subItem) => (
              <li 
                key={subItem.text} 
                className={`menu-sub-item ${location.pathname === subItem.link ? 'active' : ''}`}
              >
                <NavLink to={subItem.link} className="menu-link">
                  <i className={`menu-icon tf-icons ${subItem.icon}`}></i>
                  <div>{subItem.text}</div>
                </NavLink>
              </li>
          ))}
        </ul>
      )}
    </li>
  );
};

export default Sidebar;