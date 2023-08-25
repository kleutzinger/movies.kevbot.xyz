const { chromium } = require("playwright");
const fs = require("fs");
const extract = require("extract-zip");
const { resolve } = require("path");
require("dotenv").config();

const LBOX_USER = process.env.LBOX_USER;
const LBOX_PASS = process.env.LBOX_PASS;
const DL_PATH = "./download/dl.zip";

const letterboxdUrl = "https://letterboxd.com/data/export/";

// create a new browser instance
(async () => {
	const start = Date.now();
  //   const browser = await chromium.launch({ headless: false });
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(letterboxdUrl);

  // fill in element with id signin-username
  await page.fill("#signin-username", LBOX_USER);

  // fill in password
  await page.fill("#signin-password", LBOX_PASS);
  // Start waiting for download before clicking. Note no await.
  const downloadPromise = page.waitForEvent("download");

  // click input.button
  await page.click("input.button");
  const download = await downloadPromise;
  await download.saveAs(DL_PATH);
  await extract(DL_PATH, { dir: resolve("./download") });
  fs.copyFile("./download/watched.csv", "./watched.csv", (err) => {
    if (err) throw err;
  });
  await browser.close();
  const timeElapsed = Date.now() - start;
  console.log("successfully wrote watched.csv in " + timeElapsed + "ms");
})();
