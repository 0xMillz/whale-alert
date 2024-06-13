const axios = require('axios');
const nodemailer = require('nodemailer');

// Configuration
const WHALERT_API_KEY = 'your_whale_alert_api_key';
const MIN_VALUE = 1000000; // Minimum transaction value to track (in USD)
const EMAIL_CONFIG = {
    host: 'smtp.example.com',
    port: 587,
    secure: false,
    auth: {
        user: 'your_email@example.com',
        pass: 'your_password',
    },
};
const RECIPIENT_EMAIL = 'recipient@example.com';

// Function to get large transactions
async function getLargeTransactions() {
    const url = `https://api.whale-alert.io/v1/transactions?api_key=${WHALERT_API_KEY}&min_value=${MIN_VALUE}`;
    try {
        const response = await axios.get(url);
        return response.data.transactions;
    } catch (error) {
        console.error('Error fetching transactions:', error);
        return [];
    }
}

// Function to send email alerts
async function sendEmailAlert(transactions) {
    const transporter = nodemailer.createTransport(EMAIL_CONFIG);

    const mailOptions = {
        from: EMAIL_CONFIG.auth.user,
        to: RECIPIENT_EMAIL,
        subject: 'Large Crypto Transactions Alert',
        text: `Large transactions detected:\n\n${JSON.stringify(transactions, null, 2)}`,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Email alert sent.');
    } catch (error) {
        console.error('Error sending email:', error);
    }
}

// Main monitoring function
async function monitorLargeTransactions() {
    const transactions = await getLargeTransactions();
    if (transactions.length > 0) {
        await sendEmailAlert(transactions);
    } else {
        console.log('No large transactions found.');
    }
}

// Schedule the monitoring function to run every hour
setInterval(monitorLargeTransactions, 3600000);

// Initial run
monitorLargeTransactions();
