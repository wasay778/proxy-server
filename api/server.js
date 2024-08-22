const axios = require('axios');
const nodemailer = require('nodemailer');

module.exports = async (req, res) => {
  const { method, query, body } = req;

  if (method === 'GET' && query.id) {
    // Handle /api/collection/:id/items
    const collectionId = query.id;

    try {
      const response = await axios.get(`https://api.webflow.com/collections/${collectionId}/items`, {
        headers: {
          Authorization: `Bearer ${process.env.WEBFLOW_API_KEY}`,
          'Accept-Version': '1.0.0',
        },
      });

      res.status(200).json(response.data);
    } catch (error) {
      res.status(error.response?.status || 500).send(error.message);
    }
  } else if (method === 'GET' && query.id1 && query.id2 && query.id3) {
    // Handle /api/collections/items
    const collectionIds = [query.id1, query.id2, query.id3];

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
      res.status(200).json(results);
    } catch (error) {
      res.status(error.response?.status || 500).send(error.message);
    }
  } else if (method === 'POST') {
    // Handle /api/send-emails
    const { clientEmail, adminEmail, clientName, clientPhone, venue, orderSummary } = body;

    let transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

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
      `,
    };

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
      `,
    };

    try {
      await transporter.sendMail(clientMailOptions);
      await transporter.sendMail(adminMailOptions);
      res.status(200).json({ success: true, message: 'Emails sent successfully' });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error sending emails', error: error.message });
    }
  } else {
    res.status(404).send('Not Found');
  }
};
