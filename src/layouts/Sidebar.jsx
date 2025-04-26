import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/authContext';
import menuData from '../data/menuData.json';

const Sidebar = () => {
    const { user } = useAuth();

    // Filtrer les sections et items selon le rôle
    const filteredMenu = menuData.filter(section => 
        section.roles.some(role => role.toLowerCase() === user?.role?.toLowerCase())
    );

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
                {filteredMenu.map((section, sectionIndex) => {
                    // Filtrer les items de la section
                    const filteredItems = section.items.filter(item => 
                        item.roles.some(role => role.toLowerCase() === user?.role?.toLowerCase())
                    );

                    return (
                        <React.Fragment key={`section-${sectionIndex}-${section.header}`}>
                            {section.header && (
                                <li className="menu-header small text-uppercase">
                                    <span className="menu-header-text">{section.header}</span>
                                </li>
                            )}
                            {filteredItems.map((item, itemIndex) => (
                                <MenuItem
                                    key={`item-${sectionIndex}-${itemIndex}-${item.text}`}
                                    {...item}
                                />
                            ))}
                        </React.Fragment>
                    );
                })}
            </ul>
        </aside>
    );
};

const MenuItem = (item) => {
    const location = useLocation();
    const { user, logout } = useAuth();
    const isActive = location.pathname === item.link;
    const hasSubmenu = item.submenu && item.submenu.length > 0;
    
    // Filtrer les sous-items selon le rôle
    const filteredSubmenu = hasSubmenu 
        ? item.submenu.filter(subItem => 
            subItem.roles.some(role => role.toLowerCase() === user?.role?.toLowerCase())
          ) 
        : [];

    const isSubmenuActive = filteredSubmenu.some(subitem => location.pathname === subitem.link);

    const handleClick = () => {
        if (item.text === "Déconnexion") {
            logout();
        }
    };

    // Ne pas afficher si le sous-menu est vide
    if (hasSubmenu && filteredSubmenu.length === 0) return null;

    return (
        <li className={`menu-item ${isActive || isSubmenuActive ? 'active' : ''} ${hasSubmenu && isSubmenuActive ? 'open' : ''}`}>
            {item.text === "Déconnexion" ? (
                <div
                    onClick={handleClick}
                    className="menu-link"
                    style={{ cursor: "pointer" }}
                    role="button"
                    tabIndex={0}
                >
                    <i className={`menu-icon tf-icons ${item.icon}`}></i>
                    <div>{item.text}</div>
                </div>
            ) : (
                <NavLink
                    to={item.link || '#'}
                    className={`menu-link ${hasSubmenu ? 'menu-toggle' : ''}`}
                    style={{ cursor: "pointer" }}
                    end
                >
                    <i className={`menu-icon tf-icons ${item.icon}`}></i>
                    <div>{item.text}</div>
                    {item.available === false && (
                        <div className="badge bg-label-primary fs-tiny rounded-pill ms-auto">Pro</div>
                    )}
                </NavLink>
            )}
            {hasSubmenu && filteredSubmenu.length > 0 && (
                <ul className="menu-sub">
                    {filteredSubmenu.map((subItem, subIndex) => (
                        <li key={`subitem-${subIndex}-${subItem.text}`}>
                            <NavLink
                                to={subItem.link}
                                className="menu-link"
                                style={{ cursor: "pointer" }}
                                end
                            >
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