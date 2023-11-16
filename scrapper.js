const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();

// fetch new-car-launches

app.get('/new-car-launches', async (req, res) => {
    try {
        const carData = await getNewCarLaunches();
        res.json({
            status: 200,
            data: carData,
            error: 'no error'
        });
    } catch (error) {
        res.json({
            status: 500,
            data: 'no data',
            error: 'An error occurred while fetching car data.'
        });
    }
});

async function getNewCarLaunches() {
    const list = [];
    for (let i = 1; i < 4; i++) {
        const carsPageData = await newCarLaunchesPage(`https://www.cartrade.com/new-car-launches/p-${i}`);
        list.push(...carsPageData);
    }
    return list;
}

async function newCarLaunchesPage(url) {
    try {
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);
        const carElements = $('#idbybody > div.content_are > div.content_are > div.news_left > div.inside_wrapper.gap_btm > div > ul > li');

        const carsList = carElements.map((index, element) => {
            const carItem = {
                image: $(element).find('div.left_block > span > img').attr('src'),
                name: $(element).find('div.right_block > h2 > a').attr('title'),
                price: formatNewCarsPrice($(element).find('div.right_block > div.row > div.column.prc > span').text().trim()),
                launchDate: $(element).find('div.right_block > div.row > div.column.launch > span.launch_time').html(),
                about: $(element).find('div.right_block').children().eq(4).html().trim(),
                link: $(element).find('div.right_block > h2 > a').attr('href')
            };
            return Object.values(carItem).includes(null) ? null : carItem;
        }).get();

        return carsList.filter(Boolean);
    } catch (error) {
        console.error('Error scraping car page:', error);
        return [];
    }
}

function formatNewCarsPrice(priceString) {
    const match = priceString.match(/₹ [\d.]+ Lakh - ₹ [\d.]+ Lakh/);
    return match ? match[0] : null;
}



// fetch brands

app.get('/brands', async (req, res) => {
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



// fetch key-specifications

app.get('/key-specifications', async (req, res) => {
    const url = 'https://www.cartrade.com/citroen-cars/c3-aircross/';

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
        res.status(500).json({ error: 'An error occurred while fetching data' });
    }
});



// set listener
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
