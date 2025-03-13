import React from 'react';
import { Link } from 'react-router-dom';
import './page-auth.css'; // Conservez le fichier CSS existant pour les autres styles

export const AuthWrapper = ({ children }) => {
    return (
        <div className="container-xxl">
            <div className="authentication-wrapper authentication-basic container-p-y">
                <div className="authentication-inner">
                    <div className="card">
                        <div className="card-body">
                            <div className="app-brand justify-content-center">
                                <Link aria-label='Go to Home Page' to="/" className="app-brand-link gap-2">
                                    <span className="app-brand-logo demo">
                                        {/* Remplacez le chemin par celui de votre logo STEG */}
                                        <img
                                            src="/assets/img/STEG.jpg" // Chemin vers le logo STEG
                                            alt="steg-logo"
                                            style={{
                                                width: '40px', // Ajustez la largeur du logo
                                                height: '40px', // Ajustez la hauteur du logo
                                                marginRight: '10px', // Espacement entre le logo et le texte
                                            }}
                                        />
                                    </span>
                                    <span
                                        className="app-brand-text demo text-body fw-bold"
                                        style={{ textTransform: 'uppercase' }} // Ajout de la propriété CSS
                                    >
                                        STEG
                                    </span>
                                </Link>
                            </div>
                            {children}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};