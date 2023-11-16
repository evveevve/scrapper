const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const cors = require("cors");
const app = express();

//////////////////////////////////////////////////////////////////
//index
//////////////////////////////////////////////////////////////////
app.get("/", cors(), async (req, res) => {
  res.json({
    brands: "https://desired-car.glitch.me/brands",
    keySpecifications: "https://desired-car.glitch.me/key-specifications?url=",
    newCarLaunches: "https://desired-car.glitch.me/new-car-launches",
    brandPproducts: "https://desired-car.glitch.me/brand-products?url=",
    details: "https://desired-car.glitch.me/details?url=",
  });
});

//////////////////////////////////////////////////////////////////
// fetch new-car-launches
//////////////////////////////////////////////////////////////////

app.get("/new-car-launches", cors(), async (req, res) => {
  try {
    const carData = await getNewCarLaunches();
    res.json({
      status: 200,
      data: carData,
      error: "no error",
    });
  } catch (error) {
    res.json({
      status: 500,
      data: "no data",
      error: "An error occurred while fetching car data.",
    });
  }
});

async function getNewCarLaunches() {
  const list = [];
  for (let i = 1; i < 4; i++) {
    const carsPageData = await newCarLaunchesPage(
      `https://www.cartrade.com/new-car-launches/p-${i}`
    );
    list.push(...carsPageData);
  }
  return list;
}

async function newCarLaunchesPage(url) {
  try {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);
    const carElements = $(
      "#idbybody > div.content_are > div.content_are > div.news_left > div.inside_wrapper.gap_btm > div > ul > li"
    );

    const carsList = carElements
      .map((index, element) => {
        const carItem = {
          image: $(element).find("div.left_block > span > img").attr("src"),
          name: $(element).find("div.right_block > h2 > a").attr("title"),
          price: formatNewCarsPrice(
            $(element)
              .find("div.right_block > div.row > div.column.prc > span")
              .text()
              .trim()
          ),
          launchDate: $(element)
            .find(
              "div.right_block > div.row > div.column.launch > span.launch_time"
            )
            .html(),
          about: $(element)
            .find("div.right_block")
            .children()
            .eq(4)
            .html()
            .trim(),
          link: $(element).find("div.right_block > h2 > a").attr("href"),
        };
        return Object.values(carItem).includes(null) ? null : carItem;
      })
      .get();

    return carsList.filter(Boolean);
  } catch (error) {
    console.error("Error scraping car page:", error);
    return [];
  }
}

function formatNewCarsPrice(priceString) {
  const match = priceString.match(/₹ [\d.]+ Lakh - ₹ [\d.]+ Lakh/);
  return match ? match[0] : null;
}

//////////////////////////////////////////////////////////////////
// fetch brands
//////////////////////////////////////////////////////////////////

app.get("/brands", cors(), async (req, res) => {
  const url = "https://cartrade.com/";
  const result = {
    statusCode: null,
    data: [],
    error: "no error",
  };

  try {
    const response = await axios.get(url);
    result.statusCode = response.status;

    if (response.status === 200) {
      const $ = cheerio.load(response.data);
      const logoBrnds = $(".logo_brnds");

      logoBrnds.each((index, element) => {
        const item = {
          brandName: $(element).find('span[itemprop="name"]').text() || "",
          imageSrc: $(element).find("img").attr("src") || "",
          brandHref: `https://cartrade.com/${
            $(element).find("a").attr("href") || ""
          }`,
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

//////////////////////////////////////////////////////////////////
// fetch key-specifications
//////////////////////////////////////////////////////////////////

app.get("/key-specifications", cors(), async (req, res) => {
  const { url } = req.query;

  try {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);

    const data = {};

    $("th h3.specTitle").each((index, element) => {
      const title = $(element).text().trim();
      const value = $(element).closest("tr").find("td.specData").text().trim();
      data[title] = value;
    });

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "An error occurred while fetching data" });
  }
});

//////////////////////////////////////////////////////////////////
//brand products
//////////////////////////////////////////////////////////////////

async function brandProducts(url) {
  const carData = {
    "status code": null,
    data: [],
    error: "no error",
  };
  try {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);

    const body = $(
      "#idbybody > div.container > main > section.make-page-right-block > div > ul"
    );
    const carDetails = body.find("li.border-bottom-white-smoke");

    carData["status code"] = response.status;

    carData["data"] = carDetails
      .map((index, carDetail) => {
        const carName = $(carDetail).find("h3 a").text().trim();
        const carPrice = $(carDetail)
          .find("div.car-list-details > strong")
          .text()
          .replace(/\n|\t/g, "")
          .trim();
        const carImage = $(carDetail).find("div> a img").attr("src");
        const carLink = `https://cartrade.com${$(carDetail)
          .find("h3 a")
          .attr("href")}`;
        const totalVersions = $(carDetail)
          .find("div:nth-child(2) > button")
          .text()
          .trim()
          .split(" ")[0];

        const versions = $(carDetail)
          .find("tbody > tr")
          .map((i, versionRow) => {
            const versionLink =
              $(versionRow).find("td:nth-child(2) a").attr("href") || "N/A";
            const versionName =
              $(versionRow).find("td:nth-child(2) a").attr("title") || "";
            const fuelType = $(versionRow).find("td:nth-child(3)").text();
            const transmissionType = $(versionRow)
              .find("td:nth-child(4)")
              .text();
            const mileage = $(versionRow).find("td:nth-child(5)").text();
            const price = $(versionRow).find("td p.font-15").text() || "N/A";

            return {
              "version link": versionLink,
              version: versionName,
              "fuel type": fuelType,
              "transmission type": transmissionType,
              mileage: mileage,
              price: price,
            };
          })
          .get();

        return {
          "car name": carName,
          "car price": carPrice,
          "car image": carImage,
          "car link": carLink,
          "total versions": totalVersions,
          versions: versions,
        };
      })
      .get();

    return carData;
  } catch (error) {
    carData["error"] = error.message;
    carData["status code"] = 500;
    return carData;
  }
}

app.get("/brand-products", cors(), async (req, res) => {
  const { url } = req.query;
  const carData = await brandProducts(url);
  res.json(carData);
});

//////////////////////////////////////////////////////////////////
// fetch details
//////////////////////////////////////////////////////////////////


app.get('/details',cors(), async (req, res) => {
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
        const colours = [];
        const clr = $colour(" div.swiper-wrapper").children();
        clr.each((index, element) => {
            // colours[$colour(element).attr("data-color-name")] =
             if(  $colour(element).find('div>img').attr('src')!=null){
               colours.push($colour(element).find('div>img').attr('src'));
             };
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


// set listener
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
