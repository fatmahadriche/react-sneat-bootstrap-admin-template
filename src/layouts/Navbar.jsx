import { useAuth } from '../context/authContext';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import debounce from 'lodash-es/debounce';

const Navbar = () => {
  const { logout, user } = useAuth(); // Récupérer l'utilisateur connecté et la fonction de déconnexion
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef(null); // Référence pour gérer les clics en dehors de la zone de recherche
  const navigate = useNavigate();

  // Gestion des clics en dehors de la zone de recherche
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Recherche avec debounce pour limiter les appels API
  const performSearch = debounce(async (query) => {
    if (!query) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    try {
      setIsSearching(true);
      const response = await axios.get(`${import.meta.env.VITE_APP_API_URL}/auth/admin/search?q=${query}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setSearchResults(response.data);
      setShowResults(true);
    } catch (error) {
      console.error('Erreur de recherche:', error);
      toast.error('Erreur lors de la recherche');
    } finally {
      setIsSearching(false);
    }
  }, 300);

  // Gestion du changement de la recherche
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    performSearch(query);
  };

  // Gestion du clic sur un résultat
  const handleResultClick = (userId) => {
    navigate(`/utilisateurs/${userId}`);
    setSearchQuery('');
    setShowResults(false);
  };

  return (
    <nav
      className="layout-navbar container-xxl navbar navbar-expand-xl navbar-detached align-items-center bg-navbar-theme"
      id="layout-navbar"
    >
      <div className="layout-menu-toggle navbar-nav align-items-xl-center me-3 me-xl-0 d-xl-none">
        <a aria-label="toggle for sidebar" className="nav-item nav-link px-0 me-xl-4" href="#">
          <i className="bx bx-menu bx-sm"></i>
        </a>
      </div>

      <div className="navbar-nav-right d-flex align-items-center" id="navbar-collapse" ref={searchRef}>
        {/* Formulaire de recherche */}
        <div className="position-relative">
          <form onSubmit={(e) => e.preventDefault()}>
            <input
              type="text"
              className="form-control search-input"
              placeholder="Rechercher utilisateur..."
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => setShowResults(true)}
            />
            {isSearching && (
              <div className="position-absolute top-50 end-0 translate-middle-y me-2">
                <div className="spinner-border spinner-border-sm" role="status">
                  <span className="visually-hidden">Chargement...</span>
                </div>
              </div>
            )}
          </form>

          {/* Affichage des résultats de recherche */}
          {showResults && searchResults.length > 0 && (
            <div className="search-results-dropdown card position-absolute mt-1 w-100">
              <div className="card-body p-2">
                {searchResults.map((user) => (
                  <div
                    key={user._id}
                    className="search-item d-flex align-items-center p-2 hover-bg"
                    role="button"
                    onClick={() => handleResultClick(user._id)}
                  >
                    <div className="flex-grow-1">
                      <div className="fw-semibold">
                        {user.nom}
                      </div>
                      <small className="text-muted">Matricule: {user.matricule}</small>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Menu utilisateur */}
        <ul className="navbar-nav flex-row align-items-center ms-auto">
          <li className="nav-item navbar-dropdown dropdown-user dropdown">
            <a
              aria-label="dropdown profile avatar"
              className="nav-link dropdown-toggle hide-arrow"
              href="#"
              data-bs-toggle="dropdown"
            >
              <div className="avatar avatar-online">
                <img
                  src="../assets/img/avatars/1.png"
                  className="w-px-40 h-auto rounded-circle"
                  alt="avatar-image"
                  aria-label="Avatar Image"
                />
              </div>
            </a>
            <ul className="dropdown-menu dropdown-menu-end">
              <li>
                <a aria-label="go to profile" className="dropdown-item" href="#">
                  <div className="d-flex">
                    <div className="flex-shrink-0 me-3">
                      <div className="avatar avatar-online">
                        <img
                          src="../assets/img/avatars/1.png"
                          className="w-px-40 h-auto rounded-circle"
                          alt="avatar-image"
                          aria-label="Avatar Image"
                        />
                      </div>
                    </div>
                    <div className="flex-grow-1">
                      <span className="fw-medium d-block">John Doe</span>
                      <small className="text-muted">Admin</small>
                    </div>
                  </div>
                </a>
              </li>
              <li>
                <div className="dropdown-divider"></div>
              </li>
              <li>
                <a aria-label="go to profile" className="dropdown-item" href="#">
                  <i className="bx bx-user me-2"></i>
                  <span className="align-middle">My Profile</span>
                </a>
              </li>
              <li>
                <a aria-label="go to setting" className="dropdown-item" href="#">
                  <i className="bx bx-cog me-2"></i>
                  <span className="align-middle">Settings</span>
                </a>
              </li>
              <li>
                <div className="dropdown-divider"></div>
              </li>
              <li>
                <a
                  aria-label="click to log out"
                  className="dropdown-item"
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    logout();
                  }}
                >
                  <i className="bx bx-power-off me-2"></i>
                  <span className="align-middle">Log Out</span>
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