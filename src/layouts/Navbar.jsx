import { useAuth } from '../context/authContext';
import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import debounce from 'lodash.debounce';

const Navbar = () => {
  const { logout, user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef(null);
  const navigate = useNavigate();

  // Recherche avec debounce
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
            headers: { Authorization: `Bearer ${user?.token}` }
          }
        );
        setSearchResults(response.data || []);
      } catch (error) {
        if (error.response?.status !== 404) {
          toast.error('Erreur lors de la recherche');
        }
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300),
    [user?.token] // Dépendance avec optional chaining
  );

  // Gestion du changement de recherche
  useEffect(() => {
    if (showSearch) {
      debouncedSearch(searchQuery);
    }
    return () => debouncedSearch.cancel();
  }, [searchQuery, debouncedSearch, showSearch]);

  // Fermeture des résultats au clic externe
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

  // Si l'utilisateur n'est pas chargé, ne rien afficher
  if (!user) return null;

  return (
    <nav className="layout-navbar container-xxl navbar navbar-expand-xl navbar-detached align-items-center bg-navbar-theme">
      <div className="layout-menu-toggle navbar-nav align-items-xl-center me-3 me-xl-0 d-xl-none">
        <a className="nav-item nav-link px-0 me-xl-4" href="#">
          <i className="bx bx-menu bx-sm"></i>
        </a>
      </div>

      <div className="navbar-nav-right d-flex align-items-center" ref={searchRef}>
        {/* Zone de recherche */}
        <div className="d-flex align-items-center me-3" ref={searchRef}>
          {/* Icône de recherche */}
          <div className="nav-item cursor-pointer me-2" onClick={() => setShowSearch(!showSearch)}>
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

              {/* Résultats de recherche */}
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

        {/* Menu utilisateur */}
        <ul className="navbar-nav flex-row align-items-center ms-auto">
          <li className="nav-item navbar-dropdown dropdown-user dropdown">
            <a className="nav-link dropdown-toggle hide-arrow" href="#" data-bs-toggle="dropdown">
              <div className="avatar avatar-online">
                <img
                  src="../assets/img/avatars/1.png"
                  className="w-px-40 h-auto rounded-circle"
                  alt="Profil"
                />
              </div>
            </a>
            <ul className="dropdown-menu dropdown-menu-end py-2">
              <li>
                <div className="dropdown-header px-3">
                  <h6 className="mb-0">{user?.nom || 'Utilisateur'}</h6>
                  <small>{user?.role || 'Rôle inconnu'}</small>
                </div>
              </li>
              <li><hr className="dropdown-divider" /></li>
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
    </nav>
  );
};

export default Navbar;