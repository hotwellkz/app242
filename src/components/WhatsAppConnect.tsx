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
        <div className="flex h-screen bg-[#f0f2f5]">
            {/* Боковая панель */}
            <div className="w-[30%] min-w-[300px] border-r border-[#d1d7db] bg-white flex flex-col">
                {/* Заголовок с профилем */}
                <div className="h-[60px] bg-[#f0f2f5] px-4 flex items-center justify-between border-r border-[#d1d7db]">
                    <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <svg className="w-6 h-6 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                            </svg>
                        </div>
                    </div>
                    <div className="flex items-center space-x-3 text-[#54656f]">
                        <button className="p-2 hover:bg-gray-100 rounded-full">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                            </svg>
                        </button>
                        <button className="p-2 hover:bg-gray-100 rounded-full">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Поиск */}
                <div className="px-3 py-2 bg-white">
                    <div className="bg-[#f0f2f5] rounded-lg flex items-center px-4 py-1.5">
                        <svg className="w-5 h-5 text-[#54656f]" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
                        </svg>
                        <input 
                            type="text" 
                            placeholder="Поиск или новый чат" 
                            className="bg-transparent w-full p-2 outline-none text-[#54656f]"
                        />
                    </div>
                </div>

                {/* Список чатов */}
                <div className="flex-1 overflow-y-auto bg-white">
                    <div className="py-2">
                        {messages.map((msg, index) => (
                            <div 
                                key={index}
                                className="px-3 py-3 flex items-center hover:bg-[#f0f2f5] cursor-pointer"
                            >
                                <div className="w-12 h-12 rounded-full bg-gray-300 flex-shrink-0 flex items-center justify-center">
                                    <svg className="w-6 h-6 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                                    </svg>
                                </div>
                                <div className="ml-3 flex-1">
                                    <div className="flex justify-between items-center">
                                        <span className="font-medium text-[#111b21]">
                                            {msg.fromMe ? 'Вы' : (msg.sender || msg.from)}
                                        </span>
                                        <span className="text-xs text-[#667781]">
                                            {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </span>
                                    </div>
                                    <p className="text-sm text-[#667781] truncate">{msg.body}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Основная область */}
            <div className="flex-1 flex flex-col bg-[#efeae2] relative">
                {qrCode ? (
                    /* QR-код и статус подключения */
                    <div className="absolute inset-0 flex items-center justify-center bg-white">
                        <div className="text-center">
                            <div className="mb-8">
                                <img src="/whatsapp-logo.png" alt="WhatsApp" className="w-52 mx-auto" />
                            </div>
                            <h1 className="text-3xl font-light text-[#41525d] mb-6">WhatsApp Web</h1>
                            <div className="relative mb-8">
                                <QRCodeSVG
                                    value={qrCode}
                                    size={264}
                                    level="H"
                                    className={`mx-auto border-[10px] border-white ${isQrScanned ? 'opacity-50' : ''}`}
                                />
                                {isQrScanned && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="bg-green-500 text-white px-4 py-2 rounded-lg">
                                            QR-код успешно отсканирован
                                        </div>
                                    </div>
                                )}
                            </div>
                            <p className="text-[#41525d] mb-4">
                                {isQrScanned 
                                    ? 'QR-код успешно отсканирован' 
                                    : 'Для использования WhatsApp на компьютере:'}
                            </p>
                            {!isQrScanned && (
                                <ol className="text-[#41525d] text-sm space-y-4 max-w-md mx-auto text-left list-decimal list-inside">
                                    <li>Откройте WhatsApp на телефоне</li>
                                    <li>Нажмите <strong>Меню</strong> или <strong>Настройки</strong> и выберите <strong>Связанные устройства</strong></li>
                                    <li>Нажмите <strong>Привязать устройство</strong></li>
                                    <li>Наведите телефон на этот экран для сканирования QR-кода</li>
                                </ol>
                            )}
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Заголовок чата */}
                        <div className="h-[60px] bg-[#f0f2f5] px-4 flex items-center border-l border-[#d1d7db]">
                            <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                                <svg className="w-6 h-6 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <div className="font-medium text-[#111b21]">WhatsApp Web</div>
                                <div className="text-sm text-[#667781]">{status}</div>
                            </div>
                        </div>

                        {/* Область сообщений */}
                        <div className="flex-1 overflow-y-auto p-8" style={{backgroundImage: 'url("/whatsapp-bg.png")'}}>
                            <div className="space-y-4">
                                {messages.map((msg, index) => (
                                    <div
                                        key={index}
                                        className={`flex ${msg.fromMe ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div className={`max-w-[65%] break-words rounded-lg p-2 relative ${
                                            msg.fromMe 
                                                ? 'bg-[#d9fdd3]' 
                                                : 'bg-white'
                                        }`}>
                                            <div className="px-2 py-1">
                                                {!msg.fromMe && (
                                                    <div className="text-sm font-medium text-[#111b21] mb-1">
                                                        {msg.sender || msg.from}
                                                    </div>
                                                )}
                                                <div className="text-[#111b21]">{msg.body}</div>
                                                <div className="text-[11px] text-[#667781] text-right mt-1">
                                                    {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Поле ввода сообщения */}
                        <div className="h-[62px] bg-[#f0f2f5] px-4 flex items-center gap-2">
                            <button className="p-2 text-[#54656f] hover:bg-gray-100 rounded-full">
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM12 20c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
                                </svg>
                            </button>
                            <div className="flex-1 bg-white rounded-lg flex items-center px-4 py-2">
                                <input
                                    type="text"
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Введите сообщение"
                                    className="w-full outline-none text-[#111b21]"
                                />
                            </div>
                            <button 
                                onClick={handleSendMessage}
                                disabled={!message}
                                className="p-2 text-[#54656f] hover:bg-gray-100 rounded-full disabled:opacity-50"
                            >
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                                </svg>
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default WhatsAppConnect;
