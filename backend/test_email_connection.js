const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: 'smtp.hostinger.com',
    port: 587,
    secure: false,
    auth: {
        user: 'noreply@indebel.be',
        pass: 'BelgiqueDreambis@272829',
    },
    tls: {
        rejectUnauthorized: false
    }
});

async function verifyConnection() {
    try {
        console.log('Testing SMTP Connection...');
        await transporter.verify();
        console.log('✅ SMTP Connection Successful!');
    } catch (error) {
        console.error('❌ SMTP Connection Failed:', error);
    }
}

verifyConnection();
