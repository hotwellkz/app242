import React from 'react';
import WhatsAppConnect from '../components/WhatsAppConnect';

export const WhatsApp: React.FC = () => {
    return (
        <div className="h-screen bg-[#f0f2f5]">
            <WhatsAppConnect serverUrl="http://localhost:3000" />
        </div>
    );
};

export default WhatsApp;
