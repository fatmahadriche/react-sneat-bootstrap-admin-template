import { useState, useEffect } from "react"; // Ajoutez useEffect ici
import { useNavigate, useLocation } from "react-router-dom"; // Ajoutez useLocation
import axios from "axios";
import { FaUser, FaLock, FaSignInAlt } from "react-icons/fa";
import { useAuth } from "../../context/authContext";
import { AuthWrapper } from "./AuthWrapper";

export const LoginPage = () => {
    const [matricule, setMatricule] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        if (queryParams.get("sessionExpired")) {
            setError("Votre session a expiré. Veuillez vous reconnecter.");
        }
    }, [location]);
    const validateMatriculeInput = (event) => {
        if (
            event.key === "Backspace" || 
            event.key === "Delete" ||
            event.key === "ArrowLeft" ||
            event.key === "ArrowRight" ||
            event.key === "Tab"
        ) {
            return;
        }

        if (!/[0-9]/.test(event.key)) {
            event.preventDefault();
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
      
        try {
          const res = await axios.post(`${import.meta.env.VITE_APP_API_URL}/auth/login`, {
            matricule,
            password,
          });
      
          // Récupération des données utilisateur complètes
          const userRes = await axios.get(`${import.meta.env.VITE_APP_API_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${res.data.token}` }
          });
      
          login(res.data.token, res.data.role, userRes.data);
          navigate(`/${res.data.role.toLowerCase()}/dashboard`);
        } catch (err) {
            if (err.response?.status === 401) {
                setError("Identifiants incorrects");
            } else {
                setError(err.message || "Une erreur est survenue");
            }
        }
        setLoading(false);
    };

    return (
        <AuthWrapper>
            <h4 className="mb-2">Bienvenue sur le Portail STEG 👋</h4>
            <p className="mb-4">Veuillez saisir vos identifiants de connexion</p>

           {/* Ajouter un style pour le message d'expiration */}
            {error && (
                <div className={error.includes("expiré") 
                    ? "alert alert-warning" 
                    : "alert alert-danger"} 
                    role="alert"
                >
                    {error}
                </div>
            )}

            <form id="formAuthentication" className="mb-3" onSubmit={handleSubmit}>
                <div className="mb-3">
                    <label htmlFor="matricule" className="form-label">Matricule</label>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span style={{ marginRight: '10px' }}>
                            <FaUser />
                        </span>
                        <input
                            type="text"
                            className="form-control"
                            id="matricule-input" // ID unique
                            value={matricule}
                            onChange={(e) => {
                                const value = e.target.value;
                                if (/^\d{0,5}$/.test(value)) {
                                    setMatricule(value);
                                }
                            }}
                            onKeyDown={validateMatriculeInput}
                            placeholder="Saisissez votre matricule"
                            autoFocus
                            required
                            autoComplete="off"
                            name="matricule-hidden" // Nom non standard
                            inputMode="numeric"
                            list="autocompleteOff" // Désactive l'autocomplete
                        />
                    </div>
                </div>
                <div className="mb-3 form-password-toggle">
                    <div className="d-flex justify-content-between">
                        <label className="form-label" htmlFor="password">Mot de passe</label>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span style={{ marginRight: '10px' }}>
                            <FaLock />
                        </span>
                        <input
                            type="password"
                            autoComplete="true"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="form-control"
                            name="password"
                            placeholder="&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;"
                            aria-describedby="password"
                            required
                        />
                    </div>
                </div>
                <div className="mb-3">
                    <button
                        aria-label='Click me'
                        className="btn btn-primary d-grid w-100"
                        type="submit"
                        disabled={loading}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                        {loading ? (
                            "Connexion en cours..."
                        ) : (
                            <>
                                <FaSignInAlt style={{ marginRight: '8px' }} />
                                Se connecter
                            </>
                        )}
                    </button>
                </div>
            </form>

            <p className="text-center">

                © {new Date().getFullYear()} STEG. Tous droits réservés.
            </p>
        </AuthWrapper>
    );
};

