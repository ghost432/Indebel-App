const { sendEmail } = require('./config/email');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function testRealEmailConfiguration() {
    console.log('Testing application sendEmail function...');

    try {
        const result = await sendEmail({
            to: 'noreply@indebel.be', // Self-test
            subject: 'Test Email from Application Logic',
            text: 'This is a test to verify the sendEmail function works as expected.',
            html: '<h1>Test Email</h1><p>This checks the actual code path.</p>'
        });

        console.log('✅ Email sent successfully:', result);
    } catch (error) {
        console.error('❌ Email sending failed:', error);
        if (error.response) {
            console.error('SMTP Response:', error.response);
        }
    }
}

testRealEmailConfiguration();
