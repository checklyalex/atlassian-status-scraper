const { chromium } = require('playwright');
const axios = require('axios').default
const fs = require('fs-extra');

const args = process.argv.slice(2);

if (args.length < 2) {
  console.error('Usage: node scrape.spec.js <company name> (ChecklyHQ) <status page url> (is.checkly.online) <token> (e.g 9df028a0-...)');
  process.exit(1);
}
const comapny_name = args[0];
const url = args[1];
const token = args[2];

async function run() {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://" + url);
  const elementExists = await page.$('.group-parent-indicator');
  const twoColumns = await page.$('.components-container.two-columns');

  if (elementExists) {
    console.log('Groups used on Status Page');
    var parentElement = await page.$('.components-container');
    var childElements = await parentElement.$$('.name');
  } else {
    console.log('Groups not used on Status Page');
    if (twoColumns){
      console.log('Two Columns detected');
      var parentElement = await page.$('.components-container.two-columns');
      var childElements = await parentElement.$$('.component-inner-container .name');
    } else {
      console.log('One Column detected');
    var parentElement = await page.$('.components-container.one-column');
    var childElements = await parentElement.$$('.component-inner-container .name');
    }
  }
  

  let itemsMap = new Map();
for (const childElement of childElements) {
  const textContent = await childElement.textContent();
  const cleanContent = textContent.trim().replace(/\s+/g, ' ');

  // If the map already has this name, skip it
  if (!itemsMap.has(cleanContent)) {
    const item = { name: cleanContent, status: "Healthy" };
    itemsMap.set(cleanContent, item);
  }
}

// Convert your map values into an array
  let items = Array.from(itemsMap.values());

    // Create a JSON object with the array data
  const myJson = { items };

  // Convert the JSON object to a string
  const myJsonString = JSON.stringify(myJson);

  async function addJsonToMap(payload, token) {
    try {
      const response = await axios({
        method: 'put',
        url: `https://jsonmap.site/api/v1/items/status-page-clone`,
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + token,
        },
        data: payload
      });
      console.log("Added data to JSONMap");
      return response.data
    } catch (err) {
      throw new Error(err);
    }
  }
  if (token){
  await addJsonToMap(myJsonString, token)
  }
  const generatedFolder = './generated';
  const folderName = comapny_name
  const checksFolder = `${generatedFolder}/${folderName}/src/__checks__/status_page`;
  fs.ensureDirSync(checksFolder);
  var apiCheckArray = "";

  for (let i = 0; i < myJson.items.length; i++) {
    function replaceSpacesWithUnderscores(str) {
      return str.toLowerCase().replace(/[^a-zA-Z0-9]/g, '_');
    }
    const check_name = myJson.items[i].name;
    const logical_name = replaceSpacesWithUnderscores(myJson.items[i].name);
    console.log("Log: " + check_name );
    var apiCheckArray = apiCheckArray + `new ApiCheck('${logical_name}-api-check', {
      name: '${check_name} API',
      alertChannels: [],
      degradedResponseTime: 10000,
      maxResponseTime: 20000,
      group,
      request: {
        url: 'https://` + url + `/api/v2/status.json',
        method: 'GET',
        followRedirects: true,
        assertions: [
          AssertionBuilder.statusCode().equals(200),
        ],
      }
    })
    `
  }
    let statusPageCheckFile = `${checksFolder}/status_page.check.ts`;
    let status_page_check = `import { CheckGroup, ApiCheck, AssertionBuilder } from 'checkly/constructs'

    const group = new CheckGroup('${comapny_name}-sp-group', {
      name: '${comapny_name} Status Page',
      activated: true,
      locations: ['us-east-1', 'eu-west-1'],
      tags: ['${comapny_name}', 'Status Page'],
      concurrency: 10,
    })

    ` + apiCheckArray

    fs.writeFile(statusPageCheckFile, status_page_check, { recursive: true }, (err) => {
    if (err) {
      console.error(err);
      return;}
    });
    await context.close();
    await browser.close();
  }

run();




