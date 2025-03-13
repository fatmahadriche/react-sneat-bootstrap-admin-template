import React from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/authContext';
import menuData from '../data/menuData.json';

const Sidebar = () => {
    return (
        <aside id="layout-menu" className="layout-menu menu-vertical menu bg-menu-theme">
            <div className="app-brand demo">
                {/* Lien vers la page d'accueil */}
                <Link aria-label="Navigate to STEG homepage" to="/" className="app-brand-link">
                    {/* Nouveau logo de STEG */}
                    <span className="app-brand-logo demo">
                        <img
                            src="/assets/img/STEG.jpg"
                            alt="STEG logo"
                            aria-label="STEG logo image"
                            style={{ width: 'auto', height: '40px' }}
                        />
                    </span>
                    {/* Texte "STEG" en majuscules */}
                    <span className="app-brand-text demo menu-text fw-bold ms-2" style={{ textTransform: 'uppercase' }}>
                        STEG
                    </span>
                </Link>

                {/* Bouton pour basculer le menu sur mobile */}
                <a href="#" className="layout-menu-toggle menu-link text-large ms-auto d-block d-xl-none">
                    <i className="bx bx-chevron-left bx-sm align-middle"></i>
                </a>
            </div>
            <div className="menu-inner-shadow"></div>

            <ul className="menu-inner py-1">
                {menuData.map((section, sectionIndex) => (
                    <React.Fragment key={`section-${sectionIndex}-${section.header}`}>
                        {section.header && (
                            <li className="menu-header small text-uppercase">
                                <span className="menu-header-text">{section.header}</span>
                            </li>
                        )}
                        {section.items.map((item, itemIndex) => (
                            <MenuItem
                                key={`item-${sectionIndex}-${itemIndex}-${item.text}`}
                                {...item}
                            />
                        ))}
                    </React.Fragment>
                ))}
            </ul>
        </aside>
    );
};

const MenuItem = (item) => {
    const location = useLocation();
    const { logout } = useAuth();
    const isActive = location.pathname === item.link;
    const hasSubmenu = item.submenu && item.submenu.length > 0;
    const isSubmenuActive = hasSubmenu && item.submenu.some(subitem => location.pathname === subitem.link);

    const handleClick = () => {
        if (item.text === "Logout") {
            logout();
        }
    };

    return (
        <li className={`menu-item ${isActive || isSubmenuActive ? 'active' : ''} ${hasSubmenu && isSubmenuActive ? 'open' : ''}`}>
            {item.text === "Logout" ? (
                <div
                    aria-label={`Navigate to ${item.text}`}
                    onClick={handleClick}
                    className="menu-link"
                    style={{ cursor: "pointer" }}
                >
                    <i className={`menu-icon tf-icons ${item.icon}`}></i>
                    <div>{item.text}</div>
                </div>
            ) : (
                <div
                    className={`menu-link ${hasSubmenu ? 'menu-toggle' : ''}`}
                    style={{ cursor: hasSubmenu ? "pointer" : "default" }}
                >
                    <i className={`menu-icon tf-icons ${item.icon}`}></i>
                    <div>{item.text}</div>
                    {item.available === false && (
                        <div className="badge bg-label-primary fs-tiny rounded-pill ms-auto">Pro</div>
                    )}
                </div>
            )}
            {hasSubmenu && (
                <ul className="menu-sub">
                    {item.submenu.map((subItem, subIndex) => (
                        <li key={`subitem-${subIndex}-${subItem.text}`}>
                            <NavLink
                                to={subItem.link}
                                className="menu-link"
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