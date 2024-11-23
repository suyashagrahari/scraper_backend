const express = require("express");
const multer = require("multer");
const scrapeController = require("../controllers/scrapeController");

const router = express.Router();

const upload = multer({ dest: "uploads/" });

router.get("/data", scrapeController.getAllData); // Get all data
router.get("/data/:companyId", scrapeController.getCompanyDetails); // Get company details by ID
router.post(
  "/scrape",
  upload.single("screenshot"),
  scrapeController.scrapeWebsite
);
router.post("/save", scrapeController.saveData);
router.post("/delete", scrapeController.deleteData);
router.get("/download-csv", scrapeController.downloadCSV);

module.exports = router;
