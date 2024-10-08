const express = require('express');
const axios = require('axios');
const cors = require('cors');
const dotenv = require('dotenv');
const nodemailer = require('nodemailer');


app.use(cors({
  origin: 'https://webitflow.com',  // or your actual origin
  credentials: true
}));

fetch(url, {
  credentials: 'include'
})

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? 'https://webitflow.com'
    : ['http://localhost:3000', 'http://localhost:3001', 'https://webitflow.com'],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept-Version'],
  credentials: true,
};

app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));
app.use(express.json());

app.options('*', (req, res) => {
  res.sendStatus(200);
});

// Middleware to log requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Test route for CORS
app.get('/api/test', (req, res) => {
  res.json({ message: 'CORS is working' });
});

// Route to handle requests for a single collection
app.get('/api/collection/:id/items', async (req, res) => {
  const collectionId = req.params.id;

  try {
    const response = await axios.get(`https://api.webflow.com/collections/${collectionId}/items`, {
      headers: {
        Authorization: `Bearer ${process.env.WEBFLOW_API_KEY}`,
        'Accept-Version': '1.0.0',
      },
    });

    console.log('API response data:', response.data.items);
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching collection items:', error);
    console.error('Error response:', error.response?.data);
    res.status(error.response?.status || 500).json({ error: error.message, details: error.response?.data });
  }
});

// Route to handle requests for multiple collections
app.get('/api/collections/items', async (req, res) => {
  const collectionIds = [req.query.id1, req.query.id2, req.query.id3];

  try {
    const results = await Promise.all(
      collectionIds.map(async (id) => {
        const response = await axios.get(`https://api.webflow.com/collections/${id}/items`, {
          headers: {
            Authorization: `Bearer ${process.env.WEBFLOW_API_KEY}`,
            'Accept-Version': '1.0.0',
          },
        });
        return { collectionId: id, items: response.data };
      })
    );
    res.json(results);
  } catch (error) {
    console.error('Error fetching multiple collections:', error);
    res.status(error.response?.status || 500).json({ error: error.message });
  }
});

// Route for sending emails
app.post('/api/send-emails', async (req, res) => {
  const { clientEmail, adminEmail, clientName, clientPhone, venue, orderSummary } = req.body;

  // Create a transporter using SMTP
  let transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  
  // Verify the transporter
  transporter.verify(function(error, success) {
    if (error) {
      console.log('SMTP connection error:', error);
    } else {
      console.log("Server is ready to take our messages");
    }
  });

  // Email to client
  let clientMailOptions = {
    from: `"Your Company" <${process.env.FROM_EMAIL}>`,
    to: clientEmail,
    subject: "Your Order Summary",
    html: `
      <h1>Thank you for your order, ${clientName}!</h1>
      <h2>Order Summary:</h2>
      <p>Event: ${orderSummary.event}</p>
      <h3>Categories:</h3>
      ${orderSummary.categories.map(cat => `<p>${cat.name}: ${cat.hours} hours - $${cat.price.toFixed(2)}</p>`).join('')}
      <h3>Services:</h3>
      ${orderSummary.services.map(service => `<p>${service.name} - $${service.price.toFixed(2)}</p>`).join('')}
      <h3>Add-ons:</h3>
      ${orderSummary.addons.map(addon => `<p>${addon.name} - $${addon.price.toFixed(2)}</p>`).join('')}
      <h3>Total: $${orderSummary.total.toFixed(2)}</h3>
    `
  };

  // Email to admin
  let adminMailOptions = {
    from: `"Your Company" <${process.env.FROM_EMAIL}>`,
    to: adminEmail,
    subject: "New Order Received",
    html: `
      <h1>New Order Received</h1>
      <h2>Client Details:</h2>
      <p>Name: ${clientName}</p>
      <p>Email: ${clientEmail}</p>
      <p>Phone: ${clientPhone}</p>
      <p>Venue: ${venue}</p>
      <h2>Order Summary:</h2>
      <p>Event: ${orderSummary.event}</p>
      <h3>Categories:</h3>
      ${orderSummary.categories.map(cat => `<p>${cat.name}: ${cat.hours} hours - $${cat.price.toFixed(2)}</p>`).join('')}
      <h3>Services:</h3>
      ${orderSummary.services.map(service => `<p>${service.name} - $${service.price.toFixed(2)}</p>`).join('')}
      <h3>Add-ons:</h3>
      ${orderSummary.addons.map(addon => `<p>${addon.name} - $${addon.price.toFixed(2)}</p>`).join('')}
      <h3>Total: $${orderSummary.total.toFixed(2)}</h3>
    `
  };

  try {
    await transporter.sendMail(clientMailOptions);
    await transporter.sendMail(adminMailOptions);
    res.json({ success: true, message: 'Emails sent successfully' });
  } catch (error) {
    console.error('Error sending emails:', error);
    res.status(500).json({ success: false, message: 'Error sending emails', error: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`Proxy server is running on http://localhost:${PORT}`);
});

module.exports = app;