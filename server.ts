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

    // Check if SMTP credentials are provided (either in env or defaults)
    const smtpUser = process.env.SMTP_USER || 'ginza.quality.support@gmail.com';
    const smtpPass = process.env.SMTP_PASS || 'dlwr uypp sbkr enwt';

    if (!smtpUser || !smtpPass) {
      console.warn('SMTP credentials are not set. Email simulation mode.');
      console.log('--- EMAIL SIMULATION ---');
      console.log('To:', to);
      console.log('CC:', cc);
      console.log('Subject:', subject);
      console.log('Content:', html);
      console.log('------------------------');
      return res.json({ success: true, message: 'Email simulation successful' });
    }

    try {
      const mailOptions = {
        from: `"Ginza Quality Support" <${smtpUser}>`,
        to: Array.isArray(to) ? to.join(', ') : to,
        cc: Array.isArray(cc) ? cc.join(', ') : cc,
        subject,
        html,
      };

      const info = await transporter.sendMail(mailOptions);

      console.log('Email sent:', info.messageId);
      res.json({ success: true, messageId: info.messageId });
    } catch (err: any) {
      console.error('Email sending failed:', err);
      res.status(500).json({ error: err.message });
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
