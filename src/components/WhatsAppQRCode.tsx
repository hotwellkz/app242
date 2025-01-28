import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import QRCode from 'qrcode.react';

const WhatsAppQRCode = () => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [qrCode, setQRCode] = useState<string>('');
    const [status, setStatus] = useState<string>('Подключение...');

    useEffect(() => {
        const newSocket = io('http://localhost:3000', {
            withCredentials: true
        });

        setSocket(newSocket);

        // Обработчики событий
        newSocket.on('qr', (qr: string) => {
            setQRCode(qr);
            setStatus('Отсканируйте QR-код в WhatsApp');
        });

        newSocket.on('ready', () => {
            setStatus('WhatsApp подключен');
            setQRCode('');
        });

        newSocket.on('authenticated', () => {
            setStatus('Аутентификация успешна');
        });

        newSocket.on('auth_failure', (msg: string) => {
            setStatus(`Ошибка аутентификации: ${msg}`);
        });

        newSocket.on('disconnected', (reason: string) => {
            setStatus(`Отключено: ${reason}`);
            setQRCode('');
        });

        return () => {
            newSocket.close();
        };
    }, []);

    return (
        <div className="flex flex-col items-center justify-center p-4">
            <h2 className="text-xl font-bold mb-4">{status}</h2>
            {qrCode && (
                <div className="p-4 bg-white rounded-lg shadow-lg">
                    <QRCode value={qrCode} size={256} />
                </div>
            )}
        </div>
    );
};

export default WhatsAppQRCode;
