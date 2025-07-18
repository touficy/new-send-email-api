const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export default async function handler(req, res) {
  // ✅ Basic Auth Protection
  const authHeader = req.headers.authorization || '';
  const base64Credentials = authHeader.split(' ')[1] || '';
  const [user, pass] = Buffer.from(base64Credentials, 'base64').toString().split(':');

  if (
    user !== process.env.BASIC_USER ||
    pass !== process.env.BASIC_PASS
  ) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { phone_number, department_name } = req.body;
  if (!phone_number || !department_name) {
    return res.status(400).json({ error: 'Missing phone_number or department_name' });
  }

  const now = new Date();
  const formattedTime = now.toLocaleTimeString('en-US', { hour12: false });
  const formattedDateTime = now.toLocaleString('en-US');

  const dept = department_name.toLowerCase();
  let toEmail = 'touficy@optimalsolutions.it';
  let departmentLabel = department_name;

  if (dept === 'sor') {
    toEmail = 'soragents@mednetliban.com';
    departmentLabel = 'SOR';
  } else if (dept === 'preapproval') {
    toEmail = 'preapproval@mednetliban.com';
    departmentLabel = 'Preapproval';
  }

  const msg = {
    to: toEmail,
    from: 'touficy@optimalsolutions.it', // Verified sender
    subject: `Abandoned Call Notification - ${departmentLabel}`,
    text: `Dear ${departmentLabel} Team,

You have received an abandoned call at ${formattedTime} from the number: ${phone_number}.

Date and time: ${formattedDateTime}

Regards,
Notification System`
  };

  try {
    await sgMail.send(msg);
    return res.status(200).json({ message: 'Email sent successfully' });
  } catch (error) {
    console.error('SendGrid error:', error.response?.body || error.message);
    return res.status(500).json({
      error: 'Failed to send email',
      details: error.response?.body || error.message
    });
  }
}