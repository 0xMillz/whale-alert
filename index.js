require('dotenv').config();
const WebSocket = require('ws');
const nodemailer = require('nodemailer');

const WHALE_ALERT_API_KEY = process.env.WHALE_ALERT_API_KEY;
const MIN_VALUE_USD = process.env.MIN_VALUE_USD || '100000';
const EMAIL_CONFIG = {
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
};
const RECIPIENT_EMAIL = process.env.RECIPIENT_EMAIL;
const SUBSCRIPTION_MESSAGE = JSON.stringify({
    type: "subscribe_alerts",
    blockchains: ["solana"],
    symbols: ["sol"],
    tx_types: ["transfer"],
    min_value_usd: parseFloat(MIN_VALUE_USD),
})
let ws = null;

// Send email when a tx above MIN_VALUE_USD is broadcast
async function sendEmailAlert(transaction) {
    const transporter = nodemailer.createTransport(EMAIL_CONFIG);

    const mailOptions = {
        from: EMAIL_CONFIG.auth.user,
        to: RECIPIENT_EMAIL,
        subject: '🚀 Solana Whale Transfer Alert!! 🚀 ' + now(),
        text: `Large Solana transaction detected:\n\n${JSON.stringify(transaction, null, 2)}`,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.info('Email alert sent:', mailOptions.subject, '\t Details: ' + mailOptions.text + ' at ' + now());
    } catch (error) {
        console.error('Error sending email:', error);
    }
}

// Connect and handle messages
function connect() {
    if (ws) {
        ws.close(); // Close any existing connections
    }
    const url = `wss://leviathan.whale-alert.io/ws?api_key=${WHALE_ALERT_API_KEY}`;

    ws = new WebSocket(url);

    ws.onopen = function(_) {
        console.info('Connecting to Solana Whale WebSocket....');
        ws.send(SUBSCRIPTION_MESSAGE);
    }

    ws.onmessage = function(msg) {
        const message = JSON.parse(msg.data);

        if (message.type === 'subscribed_alerts') {
            console.info('Successfully subscribed: ', message);
        } else if (message.text) {
            console.info('TX data received, sending email alert: ', message);
            try {
                void sendEmailAlert(message);
            } catch (error) {
                console.error('Error sending email alert:', error);
            }
        } else {
            console.warn('Unexpected message: ', msg.data);
        }
    }

    ws.onclose = function(e) {
        console.warn('WebSocket connection closed. Reconnecting...', e);
        setTimeout(connect, 10 * 1000); // Wait 10 seconds
    }

    ws.onerror = function(e) {
        console.error('WebSocket error:', e);
    }

    send();
}

// Current time
function now() {
    let iso = new Date().toISOString();
    return iso.split("T")[1].split(".")[0]; // return only the time part
}

function send() {
    if (ws && ws.readyState === ws.OPEN) {
        ws.send(SUBSCRIPTION_MESSAGE);
    } else {
        console.info(now() + " " + "Awaiting wss connection...");
    }
}

// LFG
connect();