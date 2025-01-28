import React from 'react';
import WhatsAppConnect from '../components/WhatsAppConnect';

export const WhatsApp: React.FC = () => {
    return (
        <div className="min-h-screen bg-gray-50">
            <div className="container mx-auto py-6">
                <WhatsAppConnect serverUrl="http://localhost:3000" />
            </div>
        </div>
    );
};

export default WhatsApp;
