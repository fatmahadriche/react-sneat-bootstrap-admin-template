import React, { useState } from 'react';
import { AccountWrapper } from '../../components/wrapper/AccountWrapper';

export const NotificationPage = () => {
    const [notifications, setNotifications] = useState({
        newForYou: { email: true, browser: true, app: true },
        accountActivity: { email: true, browser: true, app: false },
        newBrowser: { email: true, browser: true, app: false },
        newDevice: { email: true, browser: false, app: false }
    });

    const [notificationSetting, setNotificationSetting] = useState('Only when I\'m online');

    const handleCheckboxChange = (category, type) => {
        setNotifications(prev => ({
            ...prev,
            [category]: {
                ...prev[category],
                [type]: !prev[category][type]
            }
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Ajouter la logique de soumission ici
    };

    const requestNotificationPermission = () => {
        if ('Notification' in window) {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    console.log('Notification permission granted');
                }
            });
        }
    };

    return (
        <AccountWrapper title="Notification">
            <div className="card">
                <h5 className="card-header">Recent Devices</h5>
                <div className="card-body">
                    <span>
                        We need permission from your browser to show notifications.
                        <button 
                            type="button" 
                            className="fw-medium text-primary btn btn-link p-0"
                            onClick={requestNotificationPermission}
                            aria-label="Request notification permission"
                        >
                            Request Permission
                        </button>
                    </span>
                </div>
                
                <div className="table-responsive">
                    <table className="table table-striped table-borderless border-bottom">
                        <thead>
                            <tr>
                                <th className="text-nowrap">Type</th>
                                <th className="text-nowrap text-center">✉️ Email</th>
                                <th className="text-nowrap text-center">🖥 Browser</th>
                                <th className="text-nowrap text-center">👩🏻‍💻 App</th>
                            </tr>
                        </thead>
                        <tbody>
                            {/* New for you row */}
                            <tr>
                                <td className="text-nowrap">New for you</td>
                                {['email', 'browser', 'app'].map((type, idx) => (
                                    <td key={`newForYou-${type}`}>
                                        <div className="form-check d-flex justify-content-center">
                                            <input 
                                                className="form-check-input" 
                                                type="checkbox" 
                                                id={`newForYou-${type}`}
                                                checked={notifications.newForYou[type]}
                                                onChange={() => handleCheckboxChange('newForYou', type)}
                                            />
                                        </div>
                                    </td>
                                ))}
                            </tr>

                            {/* Account activity row */}
                            <tr>
                                <td className="text-nowrap">Account activity</td>
                                {['email', 'browser', 'app'].map((type, idx) => (
                                    <td key={`accountActivity-${type}`}>
                                        <div className="form-check d-flex justify-content-center">
                                            <input 
                                                className="form-check-input" 
                                                type="checkbox" 
                                                id={`accountActivity-${type}`}
                                                checked={notifications.accountActivity[type]}
                                                onChange={() => handleCheckboxChange('accountActivity', type)}
                                            />
                                        </div>
                                    </td>
                                ))}
                            </tr>

                            {/* New browser row */}
                            <tr>
                                <td className="text-nowrap">A new browser used to sign in</td>
                                {['email', 'browser', 'app'].map((type, idx) => (
                                    <td key={`newBrowser-${type}`}>
                                        <div className="form-check d-flex justify-content-center">
                                            <input 
                                                className="form-check-input" 
                                                type="checkbox" 
                                                id={`newBrowser-${type}`}
                                                checked={notifications.newBrowser[type]}
                                                onChange={() => handleCheckboxChange('newBrowser', type)}
                                            />
                                        </div>
                                    </td>
                                ))}
                            </tr>

                            {/* New device row */}
                            <tr>
                                <td className="text-nowrap">A new device is linked</td>
                                {['email', 'browser', 'app'].map((type, idx) => (
                                    <td key={`newDevice-${type}`}>
                                        <div className="form-check d-flex justify-content-center">
                                            <input 
                                                className="form-check-input" 
                                                type="checkbox" 
                                                id={`newDevice-${type}`}
                                                checked={notifications.newDevice[type]}
                                                onChange={() => handleCheckboxChange('newDevice', type)}
                                            />
                                        </div>
                                    </td>
                                ))}
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div className="card-body">
                    <h6>When should we send you notifications?</h6>
                    <form onSubmit={handleSubmit}>
                        <div className="row">
                            <div className="col-sm-6">
                                <select 
                                    id="sendNotification" 
                                    className="form-select" 
                                    name="sendNotification"
                                    value={notificationSetting}
                                    onChange={(e) => setNotificationSetting(e.target.value)}
                                >
                                    <option value="online">Only when I'm online</option>
                                    <option value="anytime">Anytime</option>
                                </select>
                            </div>
                            <div className="mt-4">
                                <button 
                                    type="submit" 
                                    className="btn btn-primary me-2"
                                    aria-label="Save changes"
                                >
                                    Save changes
                                </button>
                                <button 
                                    type="reset" 
                                    className="btn btn-outline-secondary"
                                    aria-label="Discard changes"
                                >
                                    Discard
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </AccountWrapper>
    );
};