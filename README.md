# Atlassian Status Page Scraper
This tool scrapes a specified Atlassian Status page and stores the results as Checkly API checks.  
It's intended use is for CCD's, to provide customised Check names to the prospect.  
Each endpoint in the API check is the same.  

# Usage
Install `playwright`, `axios` and `fs-extra` to get started.  
`npm i @playwright axios fs-extra`  

'Usage: `node scrape.js <company name> (ChecklyHQ) <status page url> (is.checkly.online) <token> (e.g 9df028a0-...)`  
You'll need your access token from JSONMap if you want to upload the Status Page structure for future reference.  
You don't need to provide a token. The script will skip this part if omitted.  

# WIP
This tool has only been tested with:  
- `https://is.checkly.online/` 
- `https://status.box.com/` 
- `https://status.teamwork.com/`