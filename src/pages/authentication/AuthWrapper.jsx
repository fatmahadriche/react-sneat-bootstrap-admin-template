import React from 'react';
import { Link } from 'react-router-dom';
import './page-auth.css'; // Conservez le fichier CSS existant pour les autres styles

// Dans AuthWrapper.jsx
export const AuthWrapper = ({ children }) => {
    return (
        <div className="container-xxl">
            <div className="authentication-wrapper authentication-basic container-p-y">
                <div className="authentication-inner">
                    <div className="card">
                        <div className="card-body">
                            <div className="app-brand justify-content-center">
                                {/* Remplacez Link par un div */}
                                <div className="app-brand-link gap-2" style={{ cursor: 'default' }}>
                                    <span className="app-brand-logo demo">
                                        <img
                                            src="/assets/img/STEG.jpg"
                                            alt="steg-logo"
                                            style={{ width: '40px', height: '40px' }}
                                        />
                                    </span>
                                    <span className="app-brand-text demo text-body fw-bold" style={{ textTransform: 'uppercase' }}>
                                        STEG
                                    </span>
                                </div>
                            </div>
                            {children}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};