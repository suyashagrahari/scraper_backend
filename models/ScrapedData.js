const mongoose = require("mongoose");

const ScrapedDataSchema = new mongoose.Schema(
  {
    name: String,
    description: String,
    logo: String,
    facebookUrl: String,
    linkedinUrl: String,
    twitterUrl: String,
    instagramUrl: String,
    address: String,
    email: String,
    phoneNumbers: [String],
    screenshotUrl: String,
    websiteUrl: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("ScrapedData", ScrapedDataSchema);
