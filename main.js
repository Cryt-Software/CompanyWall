/**
 * This template is a production ready boilerplate for developing with `PuppeteerCrawler`.
 * Use this to bootstrap your projects using the most up-to-date code.
 * If you're looking for examples or want to learn more, see README.
 */

const Apify = require('apify');
const { handleStart, handleList, handleDetail } = require('./src/routes');

const { utils: { log } } = Apify;


const DEBUG_LEVEL = true

const { MongoClient } = require("mongodb");

const MONGOURL = "mongodb+srv://Cryt:Skyrimrocks123@cryt.dvj2t.mongodb.net/?retryWrites=true&w=majority";
const MONGODB = 'test'

async function connect() {

    this.client = new MongoClient(MONGOURL);
    const database = client.db('test');
    this.collection = database.collection('CompanyWall');
} 

async function insert(Object){
    await this.collection.insertOne(Object)   
}

async function close(){
    this.client.close();
}
async function startDB() {

    await connect()
    await insert({'sdf':2})
    await close() 
}


Apify.main(async () => {
    const { startUrls, proxyConfig } = await Apify.getInput();

    await startDB();
   // OLD CODE 
    // const requestList = await Apify.openRequestList('start-urls', urls);

    // const {startUrls } = /** @type {Apify.RequestOptions[]} */ (await Apify.getValue('START-REQUESTS')) || [];
    // const requestList = await Apify.openRequestList('start-urls', startUrls);

    
    const requestList = await Apify.openRequestList('start-urls', ['https://www.companywall.hr/tvrtka/timgraf-media-doo/MMxqbQiY']);
    const requestQueue = await Apify.openRequestQueue();
    // const proxyConfiguration = await Apify.createProxyConfiguration();

    // const proxyConfiguration = await Apify.createProxyConfiguration(proxyConfig);


    const crawler = new Apify.PuppeteerCrawler({
        requestList,
        requestQueue,
        maxRequestRetries:1,
        // proxyConfiguration, // This is for local testing
    
        launchContext: {
            // Chrome with stealth should work for most websites.
            // If it doesn't, feel free to remove this.
            useChrome: true,
        },
        browserPoolOptions: {
            // This allows browser to be more effective against anti-scraping protections.
            // If you are having performance issues try turning this off.
            useFingerprints: true,
        },
        handlePageFunction: async (context) => {
            const { url, userData: { label } } = context.request;
            log.info('Page opened.', { label, url });
            switch (label) {
                case 'LIST':
                    return handleList(context);
                case 'DETAIL':
                    return handleDetail(context);
                default:
                    return handleStart(context);
            }
        },
    });

    log.info('Starting the crawl.');
    await crawler.run();
    log.info('Crawl finished.');
});


