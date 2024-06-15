import puppeteer from 'puppeteer';
const fs = require('node:fs');

type TCategory = {
    key: string;
    value: string;
};

type TCategoryArray = Array<TCategory>;

type TFilterData = {
    data: TCategoryArray;
    category: string;
};
type TCollectionFilterData = Array<TFilterData>;

export class ScrapperService {
    static async run() {
        try {
            console.log('Hello Scrapper!!');
            // Open the installed Chromium. We use headless: false
            // to be able to inspect the browser window.
            const browser = await puppeteer.launch({
                // headless: false,
            });

            // Open a new page / tab in the browser.
            const page = await browser.newPage();

            // Tell the tab to navigate to the PSX summary page.
            await page.goto('https://www.psx.com.pk/market-summary/');

            // Pause for 1 seconds, to see what's going on.
            await new Promise((r) => setTimeout(r, 1000));

            const keysData = await page.evaluate(() => {
                const tableBody = document.querySelectorAll<HTMLElement>('.tab-content table tr');
                const getKeys = Array.from(tableBody)[1].innerText.replace(/\s\s+/g, ' ').split(' ');
                return getKeys[0].split('\t');
            });
            console.log(keysData.length);

            const data = await page.evaluate(() => {
                const tableBody = document.querySelectorAll<HTMLElement>('.tab-content table tr');
                const getKeys = Array.from(tableBody)[2];
                return Array.from(tableBody).map((element) => element.innerText.trim().split('\t'));
            });

            const filteredData = data.map((d) => {
                if (d.length > 1) {
                    const kdArray: TCategoryArray = [];
                    keysData.forEach((kd, kdIndex) => {
                        const obj = {} as TCategory;
                        obj['key'] = kd;
                        obj['value'] = d[kdIndex];
                        kdArray.push(obj);
                    });
                    return kdArray;
                } else return d;
            });

            const newFilteredData: TCollectionFilterData = [];
            for (let i = 0; i < filteredData.length; i++) {
                const obj: any = {};
                // if (filteredData[i][0] == 'POWER GENERATION & DISTRIBUTION') {
                obj['category'] = filteredData[i][0];
                const categoryArray = [];
                i += 2;
                while (1) {
                    categoryArray.push(filteredData[i]);
                    if (filteredData.length < i + 2 || filteredData[i + 1].length <= 1) break;
                    ++i;
                }
                obj['data'] = categoryArray;
                newFilteredData.push(obj);
                // }
            } //[newFilteredData[37], newFilteredData[38]]
            fs.writeFile('data.txt', JSON.stringify(newFilteredData), (err: any) => {
                if (err) {
                    console.error(err);
                } else {
                    console.log('file written successfully');
                }
            });

            console.log(newFilteredData.length);

            console.log('newFilteredData >>', newFilteredData);

            newFilteredData.forEach((nfd) => {
                console.log(nfd.category);
            });

            // Turn off the browser to clean up after ourselves.
            await browser.close();
        } catch (error) {
            console.error('Failed: ', error);
            throw error;
        }
    }
}

ScrapperService.run();

