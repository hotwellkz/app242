import express from 'express';
import { Client, LocalAuth, Message } from 'whatsapp-web.js';
import { Server } from 'socket.io';
import { createServer } from 'http';
import cors from 'cors';

interface WhatsAppMessage {
    from: string;
    body: string;
    timestamp: string;
    isGroup: boolean;
    sender?: string;
    fromMe: boolean;
}

const app = express();
const port = 3000;
const httpServer = createServer(app);

// Настройка CORS для Express
const corsOptions = {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept'],
    credentials: true
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Настройка Express
app.use(express.json());

// Настройка Socket.IO с CORS
const io = new Server(httpServer, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"],
        credentials: true
    },
    pingTimeout: 60000
});

// Инициализация WhatsApp клиента
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: ['--no-sandbox'],
        headless: true
    }
});

// Обработка socket.io подключений
io.on('connection', (socket) => {
    console.log('Новое Socket.IO подключение');

    socket.on('disconnect', () => {
        console.log('Socket.IO клиент отключился');
    });
});

// Обработчики событий WhatsApp
client.on('qr', (qr) => {
    console.log('QR Code получен');
    io.emit('qr', qr);
});

client.on('ready', () => {
    console.log('WhatsApp клиент готов');
    io.emit('ready');
});

client.on('authenticated', () => {
    console.log('WhatsApp аутентифицирован');
    io.emit('authenticated');
});

client.on('auth_failure', (msg) => {
    console.error('Ошибка аутентификации:', msg);
    io.emit('auth_failure', msg);
});

client.on('disconnected', (reason) => {
    console.log('WhatsApp отключен:', reason);
    io.emit('disconnected', reason);
});

// Обработка входящих сообщений
client.on('message', async (message: Message) => {
    try {
        const chat = await message.getChat();
        const contact = await message.getContact();
        
        const whatsappMessage: WhatsAppMessage = {
            from: message.from,
            body: message.body,
            timestamp: new Date().toISOString(),
            isGroup: chat.isGroup,
            fromMe: message.fromMe,
            sender: chat.isGroup ? contact.pushname || contact.number : undefined
        };

        io.emit('whatsapp-message', whatsappMessage);
    } catch (error) {
        console.error('Ошибка при обработке сообщения:', error);
    }
});

// API для отправки сообщений
app.post('/send-message', async (req, res) => {
    try {
        const { phoneNumber, message } = req.body;

        if (!phoneNumber || !message) {
            return res.status(400).json({ 
                success: false, 
                error: 'Необходимо указать номер телефона и текст сообщения' 
            });
        }

        // Форматируем номер телефона
        const formattedNumber = phoneNumber.includes('@c.us') 
            ? phoneNumber 
            : `${phoneNumber.replace(/[^\d]/g, '')}@c.us`;

        // Отправляем сообщение
        const response = await client.sendMessage(formattedNumber, message);

        res.json({ 
            success: true, 
            message: 'Сообщение отправлено успешно',
            messageId: response.id 
        });
    } catch (error) {
        console.error('Ошибка при отправке сообщения:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Ошибка при отправке сообщения' 
        });
    }
});

// Запуск сервера
httpServer.listen(port, () => {
    console.log(`Сервер запущен на порту ${port}`);
    // Инициализация WhatsApp клиента
    client.initialize()
        .catch(error => console.error('Ошибка при инициализации WhatsApp клиента:', error));
});
