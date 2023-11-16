const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
const PORT = process.env.PORT || 4000;  // Use a different port (e.g., 4000)



app.get('/api/brands', async (req, res) => {
    const url = 'https://cartrade.com/';
    const result = {
        statusCode: null,
        data: [],
        error: 'no error',
    };

    try {
        const response = await axios.get(url);
        result.statusCode = response.status;

        if (response.status === 200) {
            const $ = cheerio.load(response.data);
            const logoBrnds = $('.logo_brnds');

            logoBrnds.each((index, element) => {
                const item = {
                    brandName: $(element).find('span[itemprop="name"]').text() || '',
                    imageSrc: $(element).find('img').attr('src') || '',
                    brandHref: `https://cartrade.com/${$(element).find('a').attr('href') || ''}`,
                };
                result.data.push(item);
            });
        } else {
            throw new Error(`Received unexpected status code: ${response.status}`);
        }
    } catch (error) {
        result.error = `Error fetching data: ${error.message}`;
    }

    res.json(result);
});

const listener = app.listen(PORT, () => {
    console.log('Your app is listening on port ' + PORT);
});
