const { sendEmail, emailTemplates } = require('../config/email');
require('dotenv').config();

const testOTP = async () => {
    const email = 'mounchilithierr432@gmail.com';
    const name = 'Mounchili Thierry';
    const otp = '123456';

    console.log(`Sending test OTP to ${email}...`);
    const result = await sendEmail(emailTemplates.otpVerification(name, otp, email));

    if (result.success) {
        console.log('✅ Test OTP email sent successfully!');
    } else {
        console.error('❌ Failed to send test OTP email:', result.error);
    }
    process.exit(result.success ? 0 : 1);
};

testOTP();
