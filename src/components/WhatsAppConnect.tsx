import React, { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { WhatsAppMessage } from '../types/WhatsAppTypes';
import { QRCodeSVG } from 'qrcode.react';

interface WhatsAppConnectProps {
    serverUrl: string;
}

const WhatsAppConnect: React.FC<WhatsAppConnectProps> = ({ serverUrl }) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [qrCode, setQrCode] = useState<string>('');
    const [isQrScanned, setIsQrScanned] = useState<boolean>(false);
    const [status, setStatus] = useState<string>('Подключение...');
    const [phoneNumber, setPhoneNumber] = useState<string>('');
    const [message, setMessage] = useState<string>('');
    const [messages, setMessages] = useState<WhatsAppMessage[]>([]);

    useEffect(() => {
        const newSocket = io(serverUrl, {
            withCredentials: true
        });

        newSocket.on('connect', () => {
            setStatus('Подключено к серверу');
        });

        newSocket.on('qr', (qrData: string) => {
            console.log('Получен QR-код');
            setQrCode(qrData);
            setIsQrScanned(false);
            setStatus('Ожидание сканирования QR-кода');
        });

        newSocket.on('ready', () => {
            console.log('WhatsApp готов');
            setStatus('WhatsApp подключен');
            setIsQrScanned(true);
            setQrCode('');
        });

        newSocket.on('whatsapp-message', (message: WhatsAppMessage) => {
            console.log('Получено новое сообщение:', message);
            setMessages(prev => [...prev, message]);
        });

        newSocket.on('disconnected', () => {
            console.log('WhatsApp отключен');
            setStatus('WhatsApp отключен');
            setQrCode('');
            setIsQrScanned(false);
        });

        newSocket.on('auth_failure', (error: string) => {
            console.error('Ошибка аутентификации:', error);
            setStatus(`Ошибка: ${error}`);
        });

        setSocket(newSocket);

        return () => {
            newSocket.close();
        };
    }, [serverUrl]);

    const handleSendMessage = async () => {
        if (!phoneNumber || !message) {
            alert('Пожалуйста, заполните номер телефона и сообщение');
            return;
        }

        try {
            const response = await fetch(`${serverUrl}/send-message`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    phoneNumber,
                    message,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Ошибка при отправке сообщения');
            }

            // Добавляем отправленное сообщение в список
            const sentMessage: WhatsAppMessage = {
                from: 'me',
                body: message,
                timestamp: new Date().toISOString(),
                isGroup: false,
                fromMe: true
            };
            setMessages(prev => [...prev, sentMessage]);

            setMessage('');
            setPhoneNumber('');
        } catch (error) {
            alert('Ошибка при отправке сообщения: ' + error);
        }
    };

    return (
        <div className="container mx-auto p-4">
            <div className="bg-white rounded-lg shadow-lg p-6">
                <h1 className="text-2xl font-bold mb-4">WhatsApp Подключение</h1>
                
                {/* Статус подключения */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <p className="text-lg font-semibold flex items-center">
                        Статус: 
                        <span className="ml-2">{status}</span>
                        <span className={`ml-2 w-3 h-3 rounded-full ${
                            status.includes('подключен') ? 'bg-green-500' : 'bg-gray-500'
                        }`}></span>
                    </p>
                </div>

                {/* QR код */}
                {qrCode && (
                    <div className="mb-6 p-4 bg-white border-2 border-gray-200 rounded-lg text-center">
                        <div className="relative">
                            <QRCodeSVG
                                value={qrCode}
                                size={256}
                                level="H"
                                className={`mx-auto ${isQrScanned ? 'opacity-50' : ''}`}
                            />
                            {isQrScanned && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="bg-green-500 text-white px-4 py-2 rounded-lg">
                                        QR-код успешно отсканирован
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="mt-4">
                            <p className="text-gray-600">
                                {isQrScanned 
                                    ? 'QR-код успешно отсканирован' 
                                    : 'Отсканируйте QR-код в WhatsApp для подключения'}
                            </p>
                            <div className="mt-2 flex items-center justify-center">
                                <span className={`w-3 h-3 rounded-full ${
                                    isQrScanned ? 'bg-green-500' : 'bg-yellow-500'
                                } mr-2`}></span>
                                <span className={`text-sm ${
                                    isQrScanned ? 'text-green-500' : 'text-yellow-500'
                                }`}>
                                    {isQrScanned ? 'Подключено' : 'Ожидание сканирования'}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Входящие сообщения */}
                <div className="mb-6">
                    <h2 className="text-xl font-semibold mb-4">Входящие сообщения</h2>
                    <div className="bg-gray-50 rounded-lg p-4 h-96 overflow-y-auto">
                        {messages.length === 0 ? (
                            <p className="text-gray-500 text-center">Нет сообщений</p>
                        ) : (
                            <div className="space-y-4">
                                {messages.map((msg, index) => (
                                    <div
                                        key={index}
                                        className={`p-4 rounded-lg max-w-[80%] ${
                                            msg.fromMe 
                                                ? 'ml-auto bg-green-500 text-white' 
                                                : 'bg-white border border-gray-200 shadow-sm'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="font-semibold text-sm">
                                                {msg.fromMe ? 'Вы' : (msg.sender || msg.from)}
                                            </span>
                                            <span className="text-xs opacity-75">
                                                {new Date(msg.timestamp).toLocaleTimeString()}
                                            </span>
                                        </div>
                                        <div className="break-words">{msg.body}</div>
                                        {msg.isGroup && (
                                            <div className="text-xs mt-1 opacity-75">
                                                Групповой чат
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Форма отправки сообщения */}
                <div className="bg-gray-50 rounded-lg p-4">
                    <h2 className="text-xl font-semibold mb-4">Отправить сообщение</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Номер телефона (с кодом страны)
                            </label>
                            <input
                                type="text"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                className="w-full p-3 border rounded-lg"
                                placeholder="+79123456789"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Текст сообщения
                            </label>
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                className="w-full p-3 border rounded-lg"
                                rows={3}
                                placeholder="Введите сообщение..."
                            />
                        </div>
                        <button
                            onClick={handleSendMessage}
                            className="w-full bg-green-500 text-white py-3 px-4 rounded-lg hover:bg-green-600 transition-colors font-medium"
                            disabled={!phoneNumber || !message}
                        >
                            Отправить сообщение
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WhatsAppConnect;
