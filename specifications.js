const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();

app.get('/keySpecifications', async (req, res) => {

    const { url } = req.query;

    try {
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);

        const data = {};

        $('th h3.specTitle').each((index, element) => {
            const title = $(element).text().trim();
            const value = $(element).closest('tr').find('td.specData').text().trim();
            data[title] = value;
        });

        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'An error occurred while fetching data' + req.statusCode });
    }
});

app.listen(5000, () => {
    console.log('Server is running on http://localhost:5000');
});
