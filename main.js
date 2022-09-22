/**
 * This template is a production ready boilerplate for developing with `PuppeteerCrawler`.
 * Use this to bootstrap your projects using the most up-to-date code.
 * If you're looking for examples or want to learn more, see README.
 */

const Apify = require("apify");
const {
    handleStart,
    handleList,
    handleDetail,
    handleDirector,
} = require("./src/routes");
const Mongo = require("./src/MongoDB/mongodb.js");
const {
    extendConfigJSON,
} = require("lighthouse/lighthouse-core/config/config");
const {
    utils: { log },
} = Apify;
const DEBUG_LEVEL = true;

exports.mongo = new Mongo();

Apify.main(async () => {
    let input = await Apify.getInput();

    const { proxyConfig } = input;
    let proxyConfiguration = proxyConfig;
    let requestList = await handleInput(input);

    const requestQueue = await Apify.openRequestQueue();

    const crawler = new Apify.PuppeteerCrawler({
        requestList,
        requestQueue,
        maxRequestRetries: 1,
        useSessionPool: true,
        // Overrides default Session pool configuration
        sessionPoolOptions: {
            maxPoolSize: 100,
        },
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
            const {
                url,
                userData: { label },
            } = context.request;
            log.info("Page opened.", { label, url });
            switch (label) {
                case "LIST":
                    return handleList(context);
                case "DETAIL":
                    return handleDetail(context);
                case "DIRECTOR_PAST_COMPANIES":
                    return handleDirector(context);
                default:
                    return handleStart(context, requestQueue);
            }
        },
    });

    log.info("Starting the crawl.");
    await crawler.run();
    log.info("Crawl finished.");
});

// this is used to handle in put from apify console
async function handleInput(input) {
    const {
        startUrls,
        proxyConfig,
        sitemap,
        OIB,
        OIBs,
        MBS,
        MBSs,
        SearchTermSearch,
        SearchTerms,
    } = input;
    if (sitemap) {
        return await getUrlsFromSitemap(sitemapURL);
    } else if (OIB) {
        // scraping OIB for search
        //TODO not implmeneted
    } else if (MBS) {
        // scraping MBS for search
        //TODO not implmeneted
    } else if (SearchTermSearch) {
        // scraping search terms for search
        //TODO not implmeneted
    } else if (typeof startUrls !== "undefined") {
        if (startUrls.length > 0 || !startUrls[0] == "https://example.com/") {
            return await Apify.openRequestList("start-urls", startUrls);
        } else {
            // this is also for local dev as default start array is example.com
            return await Apify.openRequestList("start-urls", [
                "https://www.companywall.hr/tvrtka/timgraf-media-doo/MMxqbQiY",
            ]); // works
        }
    } else {
        // for local dev
        return await Apify.openRequestList("start-urls", [
            "https://www.companywall.hr/tvrtka/timgraf-media-doo/MMxqbQiY",
        ]); // works
        // const requestList = await Apify.openRequestList('start-urls', [{url: 'https://www.companywall.hr/tvrtka/timgraf-media-doo/MMxqbQiY/osobe/PP1158039', userData: {label: "DIRECTOR_PAST_COMPANIES"}}]);
    }
}

async function getUrlsFromSitemap(url, regex) {
    return await RequestList.open(null, [
        {
            requestsFromUrl: "url",
        },
    ]);
}
