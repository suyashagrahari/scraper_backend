const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");
const ScrapedData = require("../models/ScrapedData");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;

const scrapeWebsite = async (req, res) => {
  const { url } = req.body;

  let browser;
  try {
    browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setViewport({ width: 1366, height: 1800 });
    await page.goto(url, { waitUntil: "networkidle0" });

    const scrapedData = await page.evaluate((url) => {
      const getMetaContent = (name) => {
        const element = document.querySelector(
          `meta[name="${name}"], meta[property="${name}"]`
        );
        return element ? element.getAttribute("content") : null;
      };

      const getCompanyNameFromUrl = (url) => {
        const domainMatch = url.match(
          /(?:www\.)?([a-zA-Z0-9-]+)(?:\.(com|co|org|net|io|edu))/
        );
        return domainMatch ? domainMatch[1] : "Unknown";
      };

      const phoneRegex =
        /(?:\+?\d{1,2}\s?)?(\(?\d{3}\)?)[-\.\s]?\d{3}[-.\s]?\d{4}/g;

      return {
        name: getCompanyNameFromUrl(url), // Extracted name from the URL
        websiteUrl: url, // The full website URL
        description: getMetaContent("description"),
        logo: document.querySelector('link[rel*="icon"]')?.href,
        facebookUrl: document.querySelector('a[href*="facebook.com"]')?.href,
        linkedinUrl: document.querySelector('a[href*="linkedin.com"]')?.href,
        twitterUrl: document.querySelector('a[href*="twitter.com"]')?.href,
        instagramUrl: document.querySelector('a[href*="instagram.com"]')?.href,
        address: document.body.innerText.match(
          /\d+\s+[A-Za-z\s,]+\s+[A-Za-z]+\s+\d{5}/
        )?.[0],
        email: document.body.innerText.match(
          /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}/
        )?.[0],
        phoneNumbers: document.body.innerText.match(phoneRegex),
        websiteUrl: url,
      };
    }, url);

    const screenshot = await page.screenshot({
      clip: { x: 0, y: 0, width: 1366, height: 1800 },
    });

    const screenshotPath = path.join(
      __dirname,
      "../uploads",
      Date.now() + ".png"
    );
    fs.writeFileSync(screenshotPath, screenshot);

    const screenshotUrl = `${req.protocol}://${req.get(
      "host"
    )}/uploads/${path.basename(screenshotPath)}`;

    scrapedData.screenshotUrl = screenshotUrl;

    res.status(200).json({
      message: "Data scraped successfully",
      data: scrapedData,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error scraping website",
      error: error.message,
    });
  } finally {
    if (browser) await browser.close();
  }
};

const getCompanyDetails = async (req, res) => {
  const { companyId } = req.params;

  try {
    const company = await ScrapedData.findById(companyId);
    if (!company) {
      return res.status(404).json({
        message: "Company not found",
      });
    }

    res.status(200).json({
      message: "Company details fetched successfully",
      data: company,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching company details",
      error: error.message,
    });
  }
};

const getAllData = async (req, res) => {
  try {
    const data = await ScrapedData.find();
    res.status(200).json({
      message: "Data fetched successfully",
      data,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching data",
      error: error.message,
    });
  }
};

const saveData = async (req, res) => {
  let number = [];

  if (req.body.phoneNumbers) {
    number = req.body.phoneNumbers[0] || [];
  }

  try {
    const data = await ScrapedData.create({
      ...req.body,
      phoneNumbers: number,
    });

    res.status(201).json({
      message: "Data saved successfully",
      data,
    });
  } catch (error) {
    console.error("Error saving data:", error);
    res.status(500).json({
      message: "Error saving data",
      error: error.message,
    });
  }
};

const deleteData = async (req, res) => {
  try {
    const { ids } = req.body;
    await ScrapedData.deleteMany({ _id: { $in: ids } });
    res.status(200).json({
      message: "Data deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting data",
      error: error.message,
    });
  }
};

const downloadCSV = async (req, res) => {
  try {
    const data = await ScrapedData.find();
    const csvWriter = createCsvWriter({
      path: "companies.csv",
      header: [
        { id: "name", title: "Name" },
        { id: "description", title: "Description" },
        { id: "logo", title: "Logo" },
        { id: "facebookUrl", title: "Facebook URL" },
        { id: "linkedinUrl", title: "LinkedIn URL" },
        { id: "twitterUrl", title: "Twitter URL" },
        { id: "instagramUrl", title: "Instagram URL" },
        { id: "address", title: "Address" },
        { id: "email", title: "Email" },
        { id: "phoneNumbers", title: "Phone Numbers" },
        { id: "websiteUrl", title: "websiteUrl" },
      ],
    });

    await csvWriter.writeRecords(data);

    res.download("companies.csv", () => {
      fs.unlinkSync("companies.csv");
    });
  } catch (error) {
    res.status(500).json({
      message: "Error downloading CSV",
      error: error.message,
    });
  }
};

module.exports = {
  scrapeWebsite,
  getAllData,
  saveData,
  deleteData,
  downloadCSV,
  getCompanyDetails,
};
