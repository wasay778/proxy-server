import axios from 'axios';

export default async function handler(req, res) {
  const { method, query } = req;

  if (method === 'GET' && query.id1 && query.id2 && query.id3) {
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
  } else {
    res.status(404).send('Not Found');
  }
}
