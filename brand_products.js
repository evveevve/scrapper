const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();

async function brandProducts(url) {
    try {
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);

        const body = $('#idbybody > div.container > main > section.make-page-right-block > div > ul');
        const carDetails = body.find('li.border-bottom-white-smoke');

        const carData = {
            'status code': response.status,
            'data': [],
            'error': 'no error'
        };

        carData['data'] = carDetails.map((index, carDetail) => {
            const carName = $(carDetail).find('h3 a').text().trim();
            const carPrice = $(carDetail).find('div.car-list-details > strong').text().replace(/\n|\t/g, '').trim();
            const carLink = `https://cartrade.com${$(carDetail).find('h3 a').attr('href')}`;
            const totalVersions = $(carDetail).find('div:nth-child(2) > button').text().trim().split(' ')[0];
            const carImage = $(carDetail).find('div> a img').attr('src');
            const versions = $(carDetail).find('tbody > tr').map((i, versionRow) => {
                const versionLink = $(versionRow).find('td:nth-child(2) a').attr('href') || 'N/A';
                const versionName = $(versionRow).find('td:nth-child(2) a').attr('title') || '';
                const fuelType = $(versionRow).find('td:nth-child(3)').text();
                const transmissionType = $(versionRow).find('td:nth-child(4)').text();
                const mileage = $(versionRow).find('td:nth-child(5)').text();
                const price = $(versionRow).find('td p.font-15').text() || 'N/A';

                return {
                    'version link': versionLink,
                    'version': versionName,
                    'fuel type': fuelType,
                    'transmission type': transmissionType,
                    'mileage': mileage,
                    'price': price
                };
            }).get();

            return {
                'Car Name': carName,
                'Car Price': carPrice,
                'Car Image': carImage,
                'Car Link': carLink,
                'Total Versions': totalVersions,
                'versions': versions,
            };
        }).get();

        return carData;
    } catch (error) {
        throw new Error('Error fetching data:', error.message);
    }
}

app.get('/brandProducts', async (req, res) => {
    const { url } = req.query;

    try {
        const carData = await brandProducts(url);
        res.json(carData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
