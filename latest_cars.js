const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();

app.get('/', async (req, res) => {
    try {
        const carData = await getCarsData();
        res.json({
            status: 200,
            data: carData,
            error: null
        });
    } catch (error) {
        res.json({
            status: 500,
            data: null,
            error: 'An error occurred while fetching car data.'
        });
    }
});

async function getCarsData() {
    const list = [];
    for (let i = 1; i < 4; i++) {
        const carsPageData = await scrapeCarsPage(`https://www.cartrade.com/new-car-launches/p-${i}`);
        list.push(...carsPageData);
    }
    return list;
}

async function scrapeCarsPage(url) {
    try {
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);
        const carElements = $('#idbybody > div.content_are > div.content_are > div.news_left > div.inside_wrapper.gap_btm > div > ul > li');

        const carsList = carElements.map((index, element) => {
            const carItem = {
                image: $(element).find('div.left_block > span > img').attr('src'),
                name: $(element).find('div.right_block > h2 > a').attr('title'),
                price: extractPrice($(element).find('div.right_block > div.row > div.column.prc > span').text().trim()),
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

function extractPrice(priceString) {
    const match = priceString.match(/₹ [\d.]+ Lakh - ₹ [\d.]+ Lakh/);
    return match ? match[0] : null;
}

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
