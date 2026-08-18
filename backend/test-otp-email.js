const { sendEmail, emailTemplates } = require('../backend/config/email');
require('dotenv').config({ path: '.env' });

async function main() {
  const email = 'ulrichthierry47@gmail.com';
  const name = 'Test User';
  const otp = '123456';
  
  console.log('Sending test OTP email to', email);
  
  const emailConfig = emailTemplates.otpVerification(name, otp, email);
  emailConfig.to = email;
  
  const result = await sendEmail(emailConfig);
  console.log('Result:', result);
  process.exit(0);
}

main();
