import { useLocation } from "react-router-dom";
import { AccountWrapper } from "../../components/wrapper/AccountWrapper";
import { useEffect, useRef } from "react";

export const AccountPage = () => {
    const fileInputRef = useRef(null);
    const accountUserImageRef = useRef(null);
    const initialImageSrc = "../assets/img/avatars/1.png";

    const handleSubmit = (e) => {
        e.preventDefault();
        // Ajouter la logique de soumission ici
    };

    const handleDeactivate = (e) => {
        e.preventDefault();
        // Ajouter la logique de désactivation ici
    };

    useEffect(() => {
        const handleFileInputChange = (e) => {
            if (e.target.files?.[0]) {
                accountUserImageRef.current.src = URL.createObjectURL(e.target.files[0]);
            }
        };

        const handleResetClick = () => {
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
                accountUserImageRef.current.src = initialImageSrc;
            }
        };

        const fileInput = fileInputRef.current;
        const resetButton = document.querySelector('.account-image-reset');

        if (fileInput) {
            fileInput.addEventListener('change', handleFileInputChange);
        }
        if (resetButton) {
            resetButton.addEventListener('click', handleResetClick);
        }

        return () => {
            if (fileInput) {
                fileInput.removeEventListener('change', handleFileInputChange);
            }
            if (resetButton) {
                resetButton.removeEventListener('click', handleResetClick);
            }
        };
    }, []);

    return (
        <AccountWrapper title="Account">
            <div className="card mb-4">
                <h5 className="card-header">Profile Details</h5>
                <div className="card-body">
                    <div className="d-flex align-items-start align-items-sm-center gap-4">
                        <img
                            ref={accountUserImageRef}
                            src={initialImageSrc}
                            alt="user-avatar"
                            className="d-block rounded"
                            height="100"
                            width="100"
                            aria-label="Account image"
                        />
                        <div className="button-wrapper">
                            <label htmlFor="upload" className="btn btn-primary me-2 mb-4" tabIndex="0">
                                <span className="d-none d-sm-block">Upload new photo</span>
                                <i className="bx bx-upload d-block d-sm-none"></i>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    id="upload"
                                    className="account-file-input"
                                    hidden
                                    accept="image/png, image/jpeg"
                                />
                            </label>
                            <button 
                                type="button" 
                                className="btn btn-outline-secondary account-image-reset mb-4"
                                aria-label="Reset profile image"
                            >
                                <i className="bx bx-reset d-block d-sm-none"></i>
                                <span className="d-none d-sm-block">Reset</span>
                            </button>
                            <p className="text-muted mb-0">Allowed JPG, GIF or PNG. Max size of 800K</p>
                        </div>
                    </div>
                </div>
                <hr className="my-0" />
                <div className="card-body">
                    <form id="formAccountSettings" onSubmit={handleSubmit}>
                        <div className="row">
                            <div className="mb-3 col-md-6">
                                <label htmlFor="firstName" className="form-label">First Name</label>
                                <input
                                    className="form-control"
                                    type="text"
                                    id="firstName"
                                    name="firstName"
                                    defaultValue="John"
                                    autoFocus
                                />
                            </div>
                            <div className="mb-3 col-md-6">
                                <label htmlFor="lastName" className="form-label">Last Name</label>
                                <input 
                                    className="form-control" 
                                    type="text" 
                                    name="lastName" 
                                    id="lastName" 
                                    defaultValue="Doe" 
                                />
                            </div>
                            <div className="mb-3 col-md-6">
                                <label htmlFor="email" className="form-label">E-mail</label>
                                <input
                                    className="form-control"
                                    type="text"
                                    id="email"
                                    name="email"
                                    defaultValue="john.doe@example.com"
                                    placeholder="john.doe@example.com"
                                />
                            </div>
                            <div className="mb-3 col-md-6">
                                <label htmlFor="organization" className="form-label">Organization</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    id="organization"
                                    name="organization"
                                    defaultValue="ThemeSelection"
                                />
                            </div>
                            <div className="mb-3 col-md-6">
                                <label className="form-label" htmlFor="phoneNumber">Phone Number</label>
                                <div className="input-group input-group-merge">
                                    <span className="input-group-text">US (+1)</span>
                                    <input
                                        type="text"
                                        id="phoneNumber"
                                        name="phoneNumber"
                                        className="form-control"
                                        placeholder="202 555 0111"
                                    />
                                </div>
                            </div>
                            <div className="mb-3 col-md-6">
                                <label htmlFor="address" className="form-label">Address</label>
                                <input 
                                    type="text" 
                                    className="form-control" 
                                    id="address" 
                                    name="address" 
                                    placeholder="Address" 
                                />
                            </div>
                            <div className="mb-3 col-md-6">
                                <label htmlFor="state" className="form-label">State</label>
                                <input 
                                    className="form-control" 
                                    type="text" 
                                    id="state" 
                                    name="state" 
                                    placeholder="California" 
                                />
                            </div>
                            <div className="mb-3 col-md-6">
                                <label htmlFor="zipCode" className="form-label">Zip Code</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    id="zipCode"
                                    name="zipCode"
                                    placeholder="231465"
                                    maxLength="6"
                                />
                            </div>
                            {/* Les sélecteurs restants avec defaultValue */}
                            <div className="mb-3 col-md-6">
                                <label className="form-label" htmlFor="country">Country</label>
                                <select id="country" className="select2 form-select" defaultValue="">
                                    {/* Options restent identiques */}
                                </select>
                            </div>
                        </div>
                        <div className="mt-2">
                            <button type="submit" className="btn btn-primary me-2">Save changes</button>
                            <button type="reset" className="btn btn-outline-secondary">Cancel</button>
                        </div>
                    </form>
                </div>
            </div>

            <div className="card">
                <h5 className="card-header">Delete Account</h5>
                <div className="card-body">
                    <div className="mb-3 col-12 mb-0">
                        <div className="alert alert-warning">
                            <h6 className="alert-heading mb-1">Are you sure you want to delete your account?</h6>
                            <p className="mb-0">Once you delete your account, there is no going back. Please be certain.</p>
                        </div>
                    </div>
                    <form id="formAccountDeactivation" onSubmit={handleDeactivate}>
                        <div className="form-check mb-3">
                            <input
                                className="form-check-input"
                                type="checkbox"
                                name="accountActivation"
                                id="accountActivation"
                            />
                            <label className="form-check-label" htmlFor="accountActivation">
                                I confirm my account deactivation
                            </label>
                        </div>
                        <button 
                            type="submit" 
                            className="btn btn-danger deactivate-account"
                            aria-label="Deactivate account"
                        >
                            Deactivate Account
                        </button>
                    </form>
                </div>
            </div>
        </AccountWrapper>
    );
};