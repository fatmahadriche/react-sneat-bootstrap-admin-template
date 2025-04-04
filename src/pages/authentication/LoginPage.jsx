import { useState } from "react";
import { Link } from "react-router-dom";
import './page-auth.css';
import { AuthWrapper } from "./AuthWrapper";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/authContext";
import { FaUser, FaLock, FaSignInAlt } from "react-icons/fa";
export const LoginPage = () => {
    const [matricule, setMatricule] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

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

        // Validation côté client
        if (!matricule || !password) {
            setError("Veuillez remplir tous les champs.");
            setLoading(false);
            return;
        }

        try {
            const res = await axios.post("http://localhost:5000/auth/login", {
                matricule,
                password,
            });

            const validRoles = ['admin']; // Seul l'admin est autorisé pour le moment
            if (!validRoles.includes(res.data.role.toLowerCase())) {
                throw new Error("Rôle utilisateur non reconnu");
            }

            // Appelez la fonction login avec le token et le rôle
            login(res.data.token, res.data.role);
        } catch (err) {
            // Gestion des erreurs sécurisées
            if (err.response) {
                // Toutes les erreurs côté serveur renvoient un message générique
                setError("Identifiants invalides. Veuillez réessayer.");
            } else if (err.request) {
                // Erreur de réseau
                setError("Impossible de se connecter au serveur. Vérifiez votre connexion internet.");
            } else {
                // Erreur inattendue
                setError("Une erreur s'est produite. Veuillez réessayer plus tard.");
            }
        }
        setLoading(false);
    };

    return (
        <AuthWrapper>
            <h4 className="mb-2">Welcome to Login! 👋</h4>
            <p className="mb-4">Please enter your login credentials.</p>

            {error && (
                <div className="alert alert-danger" role="alert">
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
                            id="matricule"
                            value={matricule}
                            onChange={(e) => {
                                const value = e.target.value;
                                if (/^\d{0,5}$/.test(value)) {
                                    setMatricule(value);
                                }
                            }}
                            onKeyDown={validateMatriculeInput}
                            placeholder="Enter your matricule"
                            autoFocus
                            required
                        />
                    </div>
                </div>
                <div className="mb-3 form-password-toggle">
                    <div className="d-flex justify-content-between">
                        <label className="form-label" htmlFor="password">Password</label>
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
                                Sign in
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

