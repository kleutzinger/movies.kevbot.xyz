const { chromium } = require("playwright");
const fs = require("fs");
const extract = require("extract-zip");
const { resolve } = require("path");
require("dotenv").config();

const LBOX_USER = process.env.LBOX_USER;
const LBOX_PASS = process.env.LBOX_PASS;
if (!LBOX_USER || !LBOX_PASS) {
  console.log("Please provide a .env file with LBOX_USER and LBOX_PASS");
  process.exit(1);
}
const DL_PATH = "./download/dl.zip";

const letterboxdUrl = "https://letterboxd.com/data/export/";

// create a new browser instance
(async () => {
  const start = Date.now();
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  page.setDefaultTimeout(20000);
  console.log(`Navigating to ${letterboxdUrl}`);
  await page.goto(letterboxdUrl);

  // fill in element with id signin-username
  await page.fill("input[name='username']", LBOX_USER);

  // fill in password
  await page.fill("input[name='password']", LBOX_PASS);
  // Start waiting for download before clicking. Note no await.
  const downloadPromise = page.waitForEvent("download");

  // click input.button
  await page.click("button");
  const download = await downloadPromise;
  await download.saveAs(DL_PATH);
  console.log(`Downloaded to ${DL_PATH}`);
  await extract(DL_PATH, { dir: resolve("./download") });
  console.log("extracted zip file");
  fs.copyFile("./download/watched.csv", "./watched.csv", (err) => {
    if (err) throw err;
  });
  console.log("watched.csv copied to root directory");
  await browser.close();
  const timeElapsed = Date.now() - start;
  console.log("successfully wrote watched.csv in " + timeElapsed + "ms");
})();
