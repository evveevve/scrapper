const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
const port = 3000;

app.get('/details', async (req, res) => {
    const { url } = req.query;
    try {
        const data = {};
        const specifications = {};
        const keySpecifications = {};
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);
        const name = $("div.overview-container > div.version-details-container.model_top_left > h1").text();
        const image = $("div.overview-container > div.pr-6.version-image-container > div > a > img").attr('src');
        const price = $('div.overview-container > div.version-details-container.model_top_left > div:nth-child(3) > ul > li.exprc > div.blk.exShrmPrc.right_space')
            .children()
            .eq(1)
            .text();
        const allSpecx = $('section.foldout > div.specifications > div');
        const keySpecx = $('div > ul> li');

        keySpecx.each((index, element) => {
            keySpecifications[$(element).find("div.keyspebdyTh > h3").text()] = $(element).find("span").text();
        })
        allSpecx.each((index, element) => {
            const heading = $(element).find('div.tagBanner > h3').text();
            const categories = $(element).find('div.category > div.spec-details');
            const detail = {};

            categories.each((index, category) => {
                const text = $(category).children().eq(0).text();
                const value = $(category).children().eq(1).hasClass('val')
                    ? $(category).children().eq(1).text()
                    : '✓';
                detail[text] = value;
            });
            specifications[heading] = detail;
        });
        const imageResponse = await axios.get(url.replace(url.split("/")[5], "images"));
        const $image = cheerio.load(imageResponse.data);
        const images = [];
        const img = $image("div.swiper-wrapper>div");
        img.each((index, element) => {
            images.push($image(element).find('img').attr('src'));
        });

        const colourResponse = await axios.get(url.replace(url.split("/")[5], "colours"));
        const $colour = cheerio.load(colourResponse.data);
        const colours = {};
        const clr = $colour(" div.swiper-wrapper").children();
        clr.each((index, element) => {
            colours[$colour(element).attr("data-color-name")] =
                $colour(element).find('div>img').attr('src')
        });
        delete keySpecifications[""];
        data["name"] = name;
        data["image"] = image;
        data["price"] = price;
        data["key-specifications"] = keySpecifications;
        data["specifications"] = specifications;
        data["images"] = images;
        data["colours"] = colours;


        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'An error occurred while scraping data.' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
