import { useAuth } from '../context/authContext';
import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { useNavigate,useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import debounce from 'lodash.debounce';
import io from 'socket.io-client';
import { useNotifications } from '../context/NotificationContext';e
const Navbar = () => {
  const { logout, user } = useAuth();
  const { notifications, fetchNotifications } = useNotifications();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef(null);
  const navigate = useNavigate();
const location = useLocation(); // Ajouter cette ligne
  const socketRef = useRef(null);
  const lastFetchRef = useRef(0);

  // Socket setup avec gestion optimisée
  useEffect(() => {
    if (!user?.token) return;

    const setupSocket = () => {
      if (socketRef.current) return;

      socketRef.current = io(import.meta.env.VITE_APP_API_URL, {
        query: { token: user.token },
        reconnectionAttempts: 3,
        reconnectionDelay: 2000,
      });

      socketRef.current.on('connect', () => {
        console.log('Socket connected');
      });

      socketRef.current.on('new-notification', (message) => {
        toast.info(message);
        // Limite le fetch à toutes les 5 secondes max
        const now = Date.now();
        if (now - lastFetchRef.current > 5000) {
          lastFetchRef.current = now;
          fetchNotifications(user);
        }
      });

      socketRef.current.on('disconnect', () => {
        console.log('Socket disconnected');
      });
    };

    setupSocket();

    // Fetch initial avec contrôle
    const now = Date.now();
    if (now - lastFetchRef.current > 1000) {
      lastFetchRef.current = now;
      fetchNotifications(user).catch(console.error);
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.off('new-notification');
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [user?.token, fetchNotifications]);

  // Recherche avec debounce optimisé
  const debouncedSearch = useCallback(
    debounce(async (query) => {
      if (!query || !user?.token) {
        setSearchResults([]);
        return;
      }
      try {
        setIsSearching(true);
        const response = await axios.get(
          `${import.meta.env.VITE_APP_API_URL}/auth/admin/search`,
          {
            params: { q: query },
            headers: { Authorization: `Bearer ${user.token}` },
            cancelToken: new axios.CancelToken(c => (searchRef.current = { cancel: c }))
          }
        );
        setSearchResults(response.data || []);
      } catch (error) {
        if (!axios.isCancel(error) && error.response?.status !== 404) {
          toast.error('Erreur lors de la recherche');
        }
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 500),
    [user?.token]
  );

  useEffect(() => {
    if (showSearch) {
      debouncedSearch(searchQuery);
    }
    return () => {
      debouncedSearch.cancel();
      if (searchRef.current?.cancel) {
        searchRef.current.cancel();
      }
    };
  }, [searchQuery, debouncedSearch, showSearch]);

  // Fermeture de la recherche au clic externe
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSearch(false);
        setSearchQuery('');
        setSearchResults([]);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;
// Réinitialisation de la recherche quand on quitte la page
useEffect(() => {
  if (location.pathname !== '/utilisateurs') {
    setShowSearch(false);
    setSearchQuery('');
    setSearchResults([]);
  }
}, [location.pathname]);
  return (
    <nav className="layout-navbar container-xxl navbar navbar-expand-xl navbar-detached align-items-center bg-navbar-theme">
      <div className="layout-menu-toggle navbar-nav align-items-xl-center me-3 me-xl-0 d-xl-none">
        <a className="nav-item nav-link px-0 me-xl-4" href="#">
          <i className="bx bx-menu bx-sm"></i>
        </a>
      </div>

      <div className="navbar-nav-right d-flex align-items-center" ref={searchRef}>
        {/* Zone de recherche */}
        {location.pathname === '/utilisateurs' && (
        <div className="d-flex align-items-center me-3">
          <div
            className="nav-item cursor-pointer me-2"
            onClick={() => setShowSearch(!showSearch)}
          >
            <i className={`bx bx-${showSearch ? 'x' : 'search'} fs-4`}></i>
          </div>
          {showSearch && (
            <div className="position-relative">
              <div className="input-group" style={{ width: "250px" }}>
                <input
                  type="text"
                  className="form-control search-input"
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                />
                {isSearching && (
                  <span className="input-group-text">
                    <div className="spinner-border spinner-border-sm" role="status">
                      <span className="visually-hidden">Chargement...</span>
                    </div>
                  </span>
                )}
              </div>
              {searchResults.length > 0 && (
                <div className="search-results card position-absolute w-100 mt-1 shadow">
                  <div className="card-body p-0">
                    {searchResults.map((resultUser) => (
                      <div
                        key={resultUser._id}
                        className="search-item d-flex align-items-center p-3 hover-bg"
                        onClick={() => {
                          navigate(`/utilisateurs/${resultUser._id}`);
                          setShowSearch(false);
                        }}
                      >
                        <div className="avatar avatar-sm me-3">
                          <span className="avatar-initial bg-label-primary rounded-circle">
                            {resultUser.nom?.[0] || 'U'}
                          </span>
                        </div>
                        <div>
                          <div className="fw-semibold">
                            {resultUser.nom} {resultUser.prenom}
                          </div>
                          <div className="text-muted small">Matricule: {resultUser.matricule}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        )}

        {/* Notification + Menu utilisateur */}
        <div className="d-flex align-items-center ms-auto">
          {/* Notifications */}
          <div className="nav-item dropdown me-3">
            <a className="nav-link dropdown-toggle hide-arrow" href="#" data-bs-toggle="dropdown">
              <i className="bx bx-bell bx-sm"></i>
              {notifications.length > 0 && (
                <span className="badge bg-danger rounded-pill">{notifications.length}</span>
              )}
            </a>
            <div className="dropdown-menu dropdown-menu-end py-0">
              <div className="dropdown-menu-header border-bottom">
                <div className="dropdown-header d-flex align-items-center py-3">
                  <h5 className="text-body mb-0 me-auto">Notifications</h5>
                </div>
              </div>
              <div className="dropdown-list-content dropdown-list-icons">
                {notifications.slice(0, 5).map((notification) => (
                  <a
                    key={notification._id}
                    href="#"
                    className="dropdown-item d-flex align-items-center"
                    onClick={(e) => {
                      e.preventDefault();
                      navigate('/account/notifications');
                    }}
                  >
                    <div className="list-item d-flex align-items-start">
                      <div className="me-3">
                        <div className="avatar">
                          <div className="avatar-initial bg-label-primary rounded">
                            <i className="bx bx-envelope"></i>
                          </div>
                        </div>
                      </div>
                      <div className="list-item-body flex-grow-1">
                        <p className="media-heading">
                          <span className="fw-bolder">{notification.message}</span>
                        </p>
                        <small className="text-muted">
                          {new Date(notification.createdAt).toLocaleString()}
                        </small>
                      </div>
                    </div>
                  </a>
                ))}
                {notifications.length > 5 && (
                  <div className="dropdown-footer text-center py-2">
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        navigate('/account/notifications');
                      }}
                    >
                      Voir toutes les notifications
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Menu utilisateur */}
          <ul className="navbar-nav flex-row align-items-center">
            <li className="nav-item navbar-dropdown dropdown-user dropdown">
              <a className="nav-link dropdown-toggle hide-arrow" href="#" data-bs-toggle="dropdown">
                <div className="avatar avatar-online">
                  {/* Remplacement de l'image par une icône professionnelle */}
                  <span className="avatar-initial bg-primary rounded-circle">
                    <i className="bx bx-user-circle fs-4"></i>
                  </span>
                </div>
              </a>
              <ul className="dropdown-menu dropdown-menu-end py-2">
                <li>
                  <div className="dropdown-header px-3">
                    <h6 className="mb-0">{user?.nom || 'Utilisateur'}</h6>
                    <small>{user?.role || 'Rôle inconnu'}</small>
                  </div>
                </li>
                <li>
                  <hr className="dropdown-divider" />
                </li>
                <li>
                  <a className="dropdown-item" href="#" onClick={logout}>
                    <i className="bx bx-power-off me-2"></i>
                    Déconnexion
                  </a>
                </li>
              </ul>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
