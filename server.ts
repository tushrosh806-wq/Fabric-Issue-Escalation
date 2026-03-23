import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure Nodemailer with Gmail SMTP
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER || 'ginza.quality.support@gmail.com',
    pass: process.env.SMTP_PASS || 'dlwr uypp sbkr enwt',
  },
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(express.json());

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.post('/api/send-email', async (req, res) => {
    const { to, cc, subject, html } = req.body;

    // Check if SMTP credentials are provided (handle potential typo SMPT)
    const smtpUser = process.env.SMTP_USER || process.env.SMPT_USER || 'ginza.quality.support@gmail.com';
    const smtpPass = process.env.SMTP_PASS || process.env.SMPT_PASS || 'dlwr uypp sbkr enwt';

    console.log(`Attempting to send email to: ${to}, cc: ${cc}`);

    if (!smtpUser || !smtpPass) {
      console.warn('SMTP credentials are not set. Email simulation mode.');
      return res.json({ success: true, message: 'Email simulation successful' });
    }

    try {
      // Re-create transporter to ensure fresh credentials from env
      const currentTransporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      const mailOptions = {
        from: `"Ginza Quality Support" <${smtpUser}>`,
        to: Array.isArray(to) ? to.join(', ') : to,
        cc: Array.isArray(cc) ? cc.join(', ') : cc,
        subject,
        html,
      };

      const info = await currentTransporter.sendMail(mailOptions);

      console.log('Email sent successfully:', info.messageId);
      res.json({ success: true, messageId: info.messageId });
    } catch (err: any) {
      console.error('Email sending failed error details:', err);
      res.status(500).json({ error: err.message, details: err.toString() });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
