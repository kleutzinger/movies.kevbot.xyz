const fs = require("fs");
const { execFileSync } = require("child_process");
const extract = require("extract-zip");
const { resolve } = require("path");

const EXPORT_URL = "https://letterboxd.com/data/export/";
const DL_DIR = resolve("./download");

function pickZip() {
  const prompt = "Select the Letterboxd export .zip";
  if (process.platform === "darwin") {
    const script = `POSIX path of (choose file with prompt "${prompt}" of type {"zip", "public.zip-archive"} default location (path to downloads folder))`;
    return execFileSync("osascript", ["-e", script], { encoding: "utf8" }).trim();
  }
  if (process.platform === "linux") {
    return execFileSync(
      "zenity",
      ["--file-selection", `--title=${prompt}`, "--file-filter=*.zip"],
      { encoding: "utf8" }
    ).trim();
  }
  if (process.platform === "win32") {
    const ps = `Add-Type -AssemblyName System.Windows.Forms; $f = New-Object System.Windows.Forms.OpenFileDialog; $f.Filter = 'Zip files (*.zip)|*.zip'; $f.Title = '${prompt}'; if ($f.ShowDialog() -eq 'OK') { Write-Output $f.FileName } else { exit 1 }`;
    return execFileSync("powershell", ["-NoProfile", "-Command", ps], {
      encoding: "utf8",
    }).trim();
  }
  throw new Error(`Unsupported platform: ${process.platform}`);
}

(async () => {
  const start = Date.now();

  console.log(`\nOpen this URL and download the export zip:\n  ${EXPORT_URL}\n`);

  let zipPath;
  try {
    zipPath = pickZip();
  } catch (e) {
    console.error("File selection cancelled.");
    process.exit(1);
  }

  if (!zipPath || !fs.existsSync(zipPath)) {
    console.error(`File not found: ${zipPath}`);
    process.exit(1);
  }
  console.log(`Selected: ${zipPath}`);

  fs.mkdirSync(DL_DIR, { recursive: true });
  await extract(zipPath, { dir: DL_DIR });
  console.log("Extracted zip");

  fs.copyFileSync(`${DL_DIR}/watched.csv`, "./watched.csv");
  console.log("watched.csv copied to root directory");

  console.log(`Done in ${Date.now() - start}ms`);
})();
