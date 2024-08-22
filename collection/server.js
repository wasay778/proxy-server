import axios from 'axios';

export default async function handler(req, res) {
  const { method, query } = req;

  if (method === 'GET' && query.id) {
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
  } else {
    res.status(404).send('Not Found');
  }
}
