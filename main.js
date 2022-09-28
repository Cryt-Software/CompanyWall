const Apify = require("apify");
const {
    handleStart,
    handleList,
    handleDetail,
    handleDirector,
} = require("./src/routes");
const Mongo = require("./src/MongoDB/mongodb");
// const {
//     extendConfigJSON,
// } = require("lighthouse/lighthouse-core/config/config");
const {
    utils: { log },
} = Apify;
const DEBUG_LEVEL = true;

exports.mongo = new Mongo();

Apify.main(async () => {
    let input = await Apify.getInput();

    const { proxyConfig } = input;

    console.log(proxyConfig)

    // if(proxyConfig) {
    //     const proxyConfiguration = await Apify.createProxyConfiguration();
    //     // const proxyUrl = proxyConfiguration.newUrl();
    // }
    
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
        proxyConfig, // This is for local testing

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
                case "SITEMAP":
                    return handleSitemap(context);    
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
        sitemapURL,
        OIB,
        OIBs,
        MBS,
        MBSs,
        SearchTermSearch,
        SearchTerms,
    } = input;
    if (sitemapURL) {
        // return await getUrlsFromSitemap(sitemapURL);
        // return await Apify.openRequestList("start-urls", [{url: startUrls, userData: {label: "SITEMAP"}}]);
        return new Apify.requestList('sitemap', [
            {url: startUrls, userData: {label: "SITEMAP"}}
        ])
        //SITEMAP
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
