const Apify = require("apify");
const { MongoExpiredSessionError } = require("mongodb");

const {
    utils: { log },
} = Apify;
const main = require("../main.js");

const DEBUG = true;
const DEBUG_LEVEL = 3;

// let mongo = main.mongo

function logInfo(message, levelOfImportance, error = false) {
    if (levelOfImportance <= DEBUG_LEVEL && DEBUG) {
        if (error) {
            console.error(message);
        } else {
            console.log(message);
        }
    }
}

exports.handleDirector = async ({ request, page,session }) => {
    // ensure that the same name is not scraped twice aka tomislav that is a owner and a directory no need to scrap twice
    // Handle details
    console.log("--------------------- Handle director ----------------------");
    let url = page.url();
    console.log(url);
    let name = request.userData.name;
    // if (typeof name !== 'undefined'){
    //     name = '';
    // }
    console.log(`THIS IS THE NAME FROM request labels ${name}`);

    var dateOfScrap = new Date();
    if (await checkForRegisterPage(page)) {
        console.error("it is register page");
        session.retire()
        return; // this needs to be use new proxy
    } else {
        console.log("Not register page");
    }
    let pastCompanies = await handleDirectorPastCompanies(page);
    let pastCompanyStats = await handleDirectoryOtherCompaniesStats(page);
    let returnObj = {
        pastCompanies: pastCompanies,
        pastCompanyStats: pastCompanies,
        pastCompanyStats:pastCompanyStats,
        url: url,
        dateOfScrap,
        name,
        Type: 'Directory breakdown'
    };
    console.log(
        "======================================= DIrector final data==============="
    );
    // console.log(returnObj)
    console.log(
        "-------------------- END OF DIRECTORY DATA --------------------"
    );

    await main.mongo.insert(returnObj);

    return returnObj;
};

exports.handleStart = async ({ request, page, session }, requestQueue) => {
    await page.waitFor(300);
    var dateOfScrap = new Date();

    let url = page.url();
    console.log(url);
    if (await checkForRegisterPage(page)) {
        console.error("it is register page");
        session.retire()
        return; // this needs to be use new proxy
    } else {
        console.log("Not register page");
    }

    await getContactDetails(page);

    let businessName = await handleBusinessName(page);
    let businessCoreDetails = await handleMainBusinessDetails(page);
    let directors = await handleDirectors(page);
    let businessDetails = await handleBusinessDetails(page);
    let businessfinancials = await getFinancialData(page);
    let businessAddress = await handleBusinessAddress(page);
    let businessSummary = await handleBusinessSummary(page);

    for (let i = 0; i < directors.length; i++) {
        //TODO MAKE SURE THAT WE ARE NOT SCRAPING THE SAME DIRECTORS OVER AND OVER AGAIN CHECK THEIR NAME
        // MAKE A LIST OF ALL THE OBJECTS WITH UNIQUE NAMES
        const name = directors[i].fullName;
        const link = directors[i].directorLink;

        requestQueue.addRequest({
            url: link,
            userData: { label: "DIRECTOR_PAST_COMPANIES", name: name },
        });
    }

    await page.waitFor(30000);
    // List scrap a director based on link given

    let returnObj = {
        Name: businessName,
        Address: businessAddress,
        Directors: directors,
        BasicInformation: businessDetails,
        Financials: businessfinancials,
        AuditorBrief: businessSummary,
        OIB: businessCoreDetails.OIB,
        MBS: businessCoreDetails.MBS,
        RegisterDate: businessCoreDetails.dataOfRegister,
        DateScraped: dateOfScrap.toString(),
        TimeToScrap: new Date() - dateOfScrap,
        Type: "company business overview",
        Url: page.url(),
    };
    console.log(
        "-----------------------------Full object coming ---------------------------"
    );

    // console.log(returnObj);

    await main.mongo.insert(returnObj);

    return returnObj;
};

exports.handleList = async ({ request, page }) => {
    // Handle pagination
};

exports.handleDetail = async ({ request, page }, requestQueue) => {
    // Handle details
    return this.handleStart({ request, page }, requestQueue)
};

exports.handleSitemap = async ({request, page, session}, requestQueue) => {

    if (await checkForRegisterPage(page)) {
        console.error("it is register page");
        session.retire()
        return; // this needs to be use new proxy
    } else {
        console.log("Not register page");
    }

    const link = page.querySelectorAll("urlset > url > loc");

    for (let i = 0; i < link.length; i++) {
        const url = link[i];
        
        requestQueue.addRequest({
            url: url,
            userData: { label: "DETAIL" },
        });
    }

}

//this gets the stats of the directory such as how many companies he as been part of etc
async function handleDirectoryOtherCompaniesStats(page) {
    let currentActiveInCompanies = await helperGetInnerText(
        page,
        "//h6[text()='Trenutno aktivan u']/following-sibling::span[1]"
    );
    let wasActiveInCompanies = await helperGetInnerText(
        page,
        "//h6[text()='Bio aktivan u']/following-sibling::span[1]"
    );
    let connectToXCompanies = await helperGetInnerText(
        page,
        "//h6[text()='Povezanih']/following-sibling::span[1]"
    );

    return {
        currentActiveInCompanies: currentActiveInCompanies,
        wasActiveInCompanies: wasActiveInCompanies,
        connectToXCompanies: connectToXCompanies,
    };
}

// This is used on the specifc information page for people connect to the company
async function handleDirectorPastCompanies(page) {
    /*
TODO
Related companies
Povezane tvrtke

//section/header/div/h3[contains(text(),"Povezane tvrtke")]/parent::div/parent::header/parent::section
All we have to do is change the section text selector to "Povezane tvrtke" and the function for past companies
works almost the same for related companies
*/

    const xpathIme = (i) =>
        `//section/header/div/h3[contains(text(),"Aktivnost osobe u tvrtkama")]/parent::div/parent::header/parent::section//table[@id="ativityInCompany"]/tbody/tr[${i}]/th[@data-title="Ime"]`;
    const xpathStatus = (i) =>
        `//section/header/div/h3[contains(text(),"Aktivnost osobe u tvrtkama")]/parent::div/parent::header/parent::section//table[@id="ativityInCompany"]/tbody/tr[${i}]/td[@data-title="Status"]`;
    const xpathOIB = (i) =>
        `//section/header/div/h3[contains(text(),"Aktivnost osobe u tvrtkama")]/parent::div/parent::header/parent::section//table[@id="ativityInCompany"]/tbody/tr[${i}]/td[@data-title="OIB"]`;
    const xpathAdresa = (i) =>
        `//section/header/div/h3[contains(text(),"Aktivnost osobe u tvrtkama")]/parent::div/parent::header/parent::section//table[@id="ativityInCompany"]/tbody/tr[${i}]/td[@data-title="Adresa"]`;
    const xpathPozicija = (i) =>
        `//section/header/div/h3[contains(text(),"Aktivnost osobe u tvrtkama")]/parent::div/parent::header/parent::section//table[@id="ativityInCompany"]/tbody/tr[${i}]/td[@data-title="Pozicija"]`;
    const xpathod = (i) =>
        `//section/header/div/h3[contains(text(),"Aktivnost osobe u tvrtkama")]/parent::div/parent::header/parent::section//table[@id="ativityInCompany"]/tbody/tr[${i}]/td[@data-title="od"]`;
    const xpathdo = (i) =>
        `//section/header/div/h3[contains(text(),"Aktivnost osobe u tvrtkama")]/parent::div/parent::header/parent::section//table[@id="ativityInCompany"]/tbody/tr[${i}]/td[@data-title="do"]`;

    const XpathDataValueRows =
        '//section/header/div/h3[contains(text(),"Aktivnost osobe u tvrtkama")]/parent::div/parent::header/parent::section//table[@id="ativityInCompany"]/tbody/tr';

    let rowsEle = await page.$x(XpathDataValueRows);
    if (rowsEle.length == 0) {
        logInfo("No info on past companies", 1);
        return {};
    } else {
        logInfo("There is info on past companies by director data");
    }

    logInfo(`There are ${rowsEle.length} amount of rows`);

    let Ime = "";
    let Status = "";
    let OIB = "";
    let Adresa = "";
    let Pozicija = "";
    let od = "";
    let doDate = "";

    let companies = [];
    for (let i = 1; i < rowsEle.length + 1; i++) {
        Ime = await helperGetInnerText(page, xpathIme(i));
        Status = await helperGetInnerText(page, xpathStatus(i));
        OIB = await helperGetInnerText(page, xpathOIB(i));
        Adresa = await helperGetInnerText(page, xpathAdresa(i));
        Pozicija = await helperGetInnerText(page, xpathPozicija(i));
        od = await helperGetInnerText(page, xpathod(i));
        doDate = await helperGetInnerText(page, xpathdo(i));
        let linkToCompany = "";
        try {
            linkToCompany = await page.evaluate(
                (a) => a.href,
                (
                    await page.$x(xpathIme(i) + "/a")
                )[0]
            );
        } catch (e) {
            console.error(e);
            console.log("failed at link for company directory had ties with");
        }

        obj = {
            Ime: Ime,
            Status: Status,
            OIB: OIB,
            Adresa: Adresa,
            Pozicija: Pozicija,
            od: od,
            linkToCompany: linkToCompany,
            do: doDate,
        };
        companies.push(obj);
    }

    console.log(companies[1]);
    return companies;
}

//TODO will implement
async function handleBankDetails(page) {
    //Računi i blokade
    //check if there
    // check other company wall to see if works
}

//This get rough information on business summary and is always differnet
// Could improve by using same technique matching <dt> and <dd> values
// Also by using the helper function to get text would make it look clear
async function handleBusinessSummary(page) {
    console.log("handleBusinessSummary called");

    let data = await page.$x(
        '//section/header/div/h3[contains(text(),"Sažetak poslovanja")]/parent::div/parent::header/parent::section/div[@class="container-fluid"]/dl//dt'
    );

    console.log(data.length);

    let businessData = [];
    for (let i = 1; i < data.length + 1; i++) {
        try {
            let title = await page.evaluate(
                (a) => a.innerText,
                (
                    await page.$x(
                        `//section/header/div/h3[contains(text(),"Sažetak poslovanja")]/parent::div/parent::header/parent::section/div[@class="container-fluid"]/dl//dt[${i}]`
                    )
                )[0]
            );

            let value = await page.evaluate(
                (a) => a.innerText,
                (
                    await page.$x(
                        `//section/header/div/h3[contains(text(),"Sažetak poslovanja")]/parent::div/parent::header/parent::section/div[@class="container-fluid"]/dl//dd[${i}]`
                    )
                )[0]
            );
            businessData.push({ [title]: value });
        } catch (e) {
            log.error(e);
        }
    }
    console.log("business summary data coming");
    console.log(businessData);
    console.log("buisness summary end");
    return businessData;
}

// Simply gets the business name
async function handleBusinessName(page) {
    let name = await helperGetInnerText(page, "//h1");
    console.log(`The business name is ${name}`);
    return {
        BusinessName: name,
    };
}

// Get the business address
async function handleBusinessAddress(page) {
    let fullAddress = await helperGetInnerText(
        page,
        "//small[@itemtype='http://schema.org/PostalAddress']"
    );
    let streetAddress = await helperGetInnerText(
        page,
        "//small[@itemtype='http://schema.org/PostalAddress']/span[@itemprop='streetAddress']"
    );
    let postalCode = await helperGetInnerText(
        page,
        "//small[@itemtype='http://schema.org/PostalAddress']/span[@itemprop='postalCode']"
    );
    let addressLocality = await helperGetInnerText(
        page,
        "//small[@itemtype='http://schema.org/PostalAddress']/span[@itemprop='addressLocality']"
    );
    let a = {
        fullAddress: fullAddress,
        streetAddress: streetAddress,
        postalCode: postalCode,
        addressLocality: addressLocality,
    };
    console.log(a);
    return a;
}

// Get concert data on the company such as OIB and MBS and date of register that isnt always there
async function handleMainBusinessDetails(page) {
    let OIB = await helperGetInnerText(
        page,
        "//div[@class='col-lg-auto col-md-12']/span[@itemprop='vatID']"
    );
    let MBS = await helperGetInnerText(
        page,
        "//div[@class='col-lg-auto col-md-12']/span[text()='MBS']/following-sibling::span"
    );
    let dataOfRegister = await helperGetInnerText(
        page,
        "//div[@class='col-lg-auto col-md-12']/span[text()='Datum osnivanja']/following-sibling::span"
    );
    a = {
        OIB: OIB,
        MBS: MBS,
        dataOfRegister: dataOfRegister,
    };
    console.log(a);
    return a;
}

// used to get text with xpath
async function helperGetInnerText(page, xpath) {
    let text = "";
    try {
        text = await page.evaluate(
            (a) => a.innerText,
            (
                await page.$x(xpath)
            )[0]
        );
    } catch (e) {
        console.log("failed at helperGetInnerText");
    }
    return text;
}

// This function checks to see if the register or login page was given meaning we need
// to swtich proxy, This hasn't been implemented yet
// TODO IMPLEMENT NEW PROXY AND FINGERPRINT WHEN True
async function checkForRegisterPage(page) {
    if (page.url() == "https://www.companywall.hr/Account/RegisterOpenUser") {
        console.log("the page url is true");
        return true;
    }
    if (page.url() == "https://www.companywall.hr/Account/Login") {
        console.log("Asking for login page, failed need new proxy");
        return true;
    }

    try {
        let title = await helperGetInnerText(
            page,
            '//*[@id="main-content"]/div/div[1]/section/header/div/h3'
        );

        if (title == "Registrirajte se za besplatan pristup") {
            console.log("the title is true");
            return true;
        } else {
            console.log("Title is not the same");
        }
    } catch (e) {
        console.log("error getting title");
    }

    return false;
}

// Handles business details that is mostly used by auditors such as their tax returns been paid properly
async function handleBusinessDetails(page) {
    // data comes in flat array of even size, with odd numbers being identifer and even being data
    console.log("handleBusinessPage called");

    let data = await page.$x(
        '//section/header/div/h3[contains(text(),"Osnovni podaci")]/parent::div/parent::header/parent::section/div[@class="container-fluid"]/dl//dt'
    );

    console.log(data.length);

    let businessData = [];
    for (let i = 1; i < data.length + 1; i++) {
        try {
            let title = await page.evaluate(
                (a) => a.innerText,
                (
                    await page.$x(
                        `//section/header/div/h3[contains(text(),"Osnovni podaci")]/parent::div/parent::header/parent::section/div[@class="container-fluid"]/dl//dt[${i}]`
                    )
                )[0]
            );

            let value = await page.evaluate(
                (a) => a.innerText,
                (
                    await page.$x(
                        `//section/header/div/h3[contains(text(),"Osnovni podaci")]/parent::div/parent::header/parent::section/div[@class="container-fluid"]/dl//dd[${i}]`
                    )
                )[0]
            );
            // log.info(title);
            // log.info(value);
            businessData.push({ [title]: value });
        } catch (e) {
            log.error(e);
        }
    }
    console.log(businessData);
    return businessData;
}

//Gets financial data on the company in the forum on a table
async function getFinancialData(page) {
    const tableXpath =
        '//section/header/div/h3[contains(text(),"Financijski sažetak")]/parent::div/parent::header/parent::section//table[@class="table table-striped no-border table-sm company-summary-table"]';
    const tableYearsHeadersXpath =
        '//section/header/div/h3[contains(text(),"Financijski sažetak")]/parent::div/parent::header/parent::section//table[@class="table table-striped no-border table-sm company-summary-table"]/thead';
    const tablesRowDataXpath =
        '//section/header/div/h3[contains(text(),"Financijski sažetak")]/parent::div/parent::header/parent::section//table[@class="table table-striped no-border table-sm company-summary-table"]/tbody/tr';

    let getRowNameValue = (rowIndex) => {
        return tablesRowDataXpath + `[${rowIndex}]` + '/td[@data-title=" "]';
    };

    let getRowValue2019 = (rowIndex) => {
        return tablesRowDataXpath + `[${rowIndex}]` + '/td[@data-title="2019"]';
    };

    let getRowValue2020 = (rowIndex) => {
        return tablesRowDataXpath + `[${rowIndex}]` + '/td[@data-title="2020"]';
    };

    let getRowValue2021 = (rowIndex) => {
        return tablesRowDataXpath + `[${rowIndex}]` + '/td[@data-title="2021"]';
    };

    // check if exists
    let table = await page.$x(tableXpath);
    if (table.length == 0) {
        console.log("No Fincancial Data");
        return {};
    } else {
        console.log("There is fincancial data");
    }

    // get row length
    let rows = await page.$x(tablesRowDataXpath);
    let rowsLength = rows.length;

    // get data
    let rowDataName = [];
    let row2019 = [];
    let row2020 = [];
    let row2021 = [];

    // just to get rid of boiler code will just use boiler was giving issues
    // let getSpecificRowData = async (i, xpathGetter, dataArray) => {
    //     dataArray.push(
    //         await page.evaluate(
    //             (a) => a.innerText,
    //             (
    //                 await page.$x(xpathGetter(i))
    //             )[0]
    //         )
    //     );
    // };

    for (let i = 1; i < rowsLength + 1; i++) {
        // getSpecificRowData(i, getRowNameValue, rowDataName)
        // getSpecificRowData(i, getRowValue2019, row2019)
        // getSpecificRowData(i, getRowValue2020, row2020)
        // getSpecificRowData(i, getRowValue2021, row2021)

        rowDataName.push(
            await page.evaluate(
                (a) => a.innerText,
                (
                    await page.$x(getRowNameValue(i))
                )[0]
            )
        );

        row2019.push(
            await page.evaluate(
                (a) => a.innerText,
                (
                    await page.$x(getRowValue2019(i))
                )[0]
            )
        );

        row2020.push(
            await page.evaluate(
                (a) => a.innerText,
                (
                    await page.$x(getRowValue2020(i))
                )[0]
            )
        );

        row2021.push(
            await page.evaluate(
                (a) => a.innerText,
                (
                    await page.$x(getRowValue2021(i))
                )[0]
            )
        );
    }
    // console.log(row2019);

    // console.log(row2020);
    // console.log(row2021);
    // console.log(rowDataName);

    let result2019 = [];
    let result2020 = [];
    let result2021 = [];

    for (let index = 0; index < rowDataName.length; index++) {
        let rowLabel = rowDataName[index];
        let row2019Single = row2019[index];
        let row2020Single = row2020[index];
        let row2021Single = row2021[index];

        result2019.push({ [rowLabel]: row2019Single });
        result2020.push({ [rowLabel]: row2020Single });
        result2021.push({ [rowLabel]: row2021Single });
    }
    let result = { 2019: result2019, 2020: result2020, 2021: result2021 };
    console.log(result);
    return result;
}

// Tries to scrap Telephone, email and web address if present by clicking on show button
// Waiting a bit, waiting for xpath and then extracting that info
// This takes far too long almost 30 seconds should be reduced
async function getContactDetails(page) {
    // Weird thing was you had to click on the I not the button strange anti-webscraping measure more then likely

    //Not working will need more waits + click in the same time, and get data in one go.
    // Click on all elements retry if errors
    // Check if button where clicked
    // then use same loop as directors and business information

    // Add in catch e -> with tracking

    // Need to have better wait function or wait until function

    // also add error handling for when the tel/web is show but not picked up by script

    const xpathForTelText =
        "//section/header/div/h3[contains(text(),'Kontakti')]/parent::div/parent::header/parent::section//div[@class='row']/div[1]//dt[text() = 'tel']";
    const xpathForTelDD =
        "//section/header/div/h3[contains(text(),'Kontakti')]/parent::div/parent::header/parent::section//div[@class='row']/div[1]//dt[text() = 'tel']/following-sibling::dd[1]";

    const xpathForEmailText =
        "//section/header/div/h3[contains(text(),'Kontakti')]/parent::div/parent::header/parent::section//div[@class='row']/div[1]//dt[text() = 'email']";
    const xpathForEmailDD =
        "//section/header/div/h3[contains(text(),'Kontakti')]/parent::div/parent::header/parent::section//div[@class='row']/div[1]//dt[text() = 'email']/following-sibling::dd[1]";

    const xpathForWebText =
        "//section/header/div/h3[contains(text(),'Kontakti')]/parent::div/parent::header/parent::section//div[@class='row']/div[1]//dt[text() = 'web']";
    const xpathForWebDD =
        "//section/header/div/h3[contains(text(),'Kontakti')]/parent::div/parent::header/parent::section//div[@class='row']/div[1]//dt[text() = 'web']/following-sibling::dd[1]";

    let TelEle = await page.$x(xpathForTelText);
    let emailEle = await page.$x(xpathForEmailText);
    let webEle = await page.$x(xpathForWebText);

    let isTel = !(TelEle.length == 0);
    let isWeb = !(webEle.length == 0);
    let isEmail = !(emailEle.length == 0);

    const extractValueFromSpan = (type) =>
        `//section/header/div/h3[contains(text(),'Kontakti')]/parent::div/parent::header/parent::section//div[@class='row']/div[1]//dt[text() = '${type}']/following-sibling::dd[1]/div/span`;

    const buttonXpath = (type) =>
        `//section/header/div/h3[contains(text(),'Kontakti')]/parent::div/parent::header/parent::section//div[@class='row']/div[1]//dt[text() = '${type}']/following-sibling::dd[1]//button//i`;

    // let telephone = "";
    // if (isTel) {
    //     console.log("Telephone is listed");
    //     const elements = await page.$x(xpathForTelDD + "//button//i");
    //     await page.waitFor(400);
    //     if (elements.length == 0) {
    //         console.log("There is no Tel button ERROR");
    //     } else {
    //         await elements[0].click();
    //         await page.waitFor(300);
    //         telephone = await helperGetInnerText(
    //             page,
    //             xpathForTelDD + "/div/span"
    //         ); //TESTING
    //         console.log(`The telephone is ${telephone}`);
    //     }
    // } else {
    //     console.log("There is no telephone listed");
    // }

    let telephone = "";
    try {
        if (isTel) {
            console.log("Telephone is listed");
            const elements = await page.$x(buttonXpath("tel"));
            // await page.waitFor(400);
            if (elements.length == 0) {
                console.log("There is no Tel button ERROR");
            } else {
                await elements[0].click();
                await page.waitFor(300);
                await page.waitFor(extractValueFromSpan("tel"), {
                    timeout: 2000,
                });
                console.log("xpath has shown");

                telephone = await helperGetInnerText(
                    page,
                    extractValueFromSpan("tel")
                ); //TESTING
                console.log(`The telephone is ${telephone}`);
            }
        } else {
            console.log("There is no telephone listed");
        }
    } catch (e) {
        console.error(e);
        console.log(
            `ERROR PROCESSING telephone in contact scraper on URL ${page.url()}`
        );
    }

    let email = "";
    try {
        if (isEmail) {
            console.log("Email is listed");
            const elements = await page.$x(buttonXpath("email"));
            await page.waitFor(400);
            if (elements.length == 0) {
                console.log("There is no email revail button ERROR");
            } else {
                await elements[0].click();
                // await page.waitFor(400);

                await page.waitFor(extractValueFromSpan("email"), {
                    timeout: 2000,
                });
                email = await helperGetInnerText(
                    page,
                    extractValueFromSpan("email")
                ); //TESTING
                console.log(`The email is ${email}`);
            }
        } else {
            console.log("There is no email listed");
        }
    } catch (e) {
        console.error(e);
        console.log(
            `ERROR PROCESSING email in contact scraper on URL ${page.url()}`
        );
    }

    let webAddress = "";
    try {
        if (isWeb) {
            console.log("There is web listed");

            const elements = await page.$x(buttonXpath("web"));
            // await page.waitFor(400);
            if (elements.length == 0) {
                console.log("There is no web button ERROR");
            } else {
                await elements[0].click();
                await page.waitFor(300);
                // await page.waitForNavigation({
                //     waitUntil: 'networkidle0',
                //     timeout: 2000
                //   });

                await page.waitFor(extractValueFromSpan("web"), {
                    timeout: 2000,
                });

                webAddress = await helperGetInnerText(
                    page,
                    extractValueFromSpan("web")
                ); //TESTING

                //TESTING XPATH ON WEB WITH XXX TO SEE IF BUTTON WAS CLICKED OR NOT
                let testText = await helperGetInnerText(
                    page,
                    '//*[@id="main-content"]/div[3]/div[1]/section/div/div/div[1]/div/dl/dd[3]/div/span'
                );
                console.log(`the test text is ${testText} `);

                console.log(`The website is ${webAddress}`);
            }
        } else {
            console.log("There is no Web");
        }
    } catch (e) {
        console.error(e);
        console.log(
            `ERROR PROCESSING Web address in contact scraper on URL ${page.url()}`
        );
    }

    // test for active button but variable is empty
    // test for active button but variable is of wrong format

    // ERROR CODE 1099
    if (isEmail && email == "") {
        console.error(
            "ERROR CODE 1099 Email button is active but text is empty"
        );
        console.error(`Error 1099 at ${page.url()}`);
    }

    if (isTel && telephone == "") {
        console.error("ERROR CODE 1098 tel button is active but text is empty");
        console.error(`Error 1097 at ${page.url()}`);
    }
    //ERROR CODE 1097
    if (isWeb && webAddress == "") {
        console.error("ERROR CODE 1097 web button is active but text is empty");
        console.error(`Error 1097 at ${page.url()}`);
    }

    const validateEmail = (email) => {
        return String(email)
            .toLowerCase()
            .match(
                /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
            );
    };
    // ERROR CODE 1096
    if (validateEmail(email)) {
        console.error(
            `ERROR CODE 1096 Not valid email ${email}, This is at ${page.url()}`
        );
    }

    let result = {
        email: email,
        telephone: telephone,
        web: webAddress,
    };
    console.log(result);
    return result;
}

//This gets the directors and their links to their specific pages
// TODO get unqie named directors and send their link to request queue
async function handleDirectors(page) {
    let dt = await page.$x(
        '//section/header/div/h3[contains(text(),"Kontakti")]/parent::div/parent::header/parent::section//div[@class="row"]/div[2]/div/dl/dt'
    );
    let dd = await page.$x(
        '//section/header/div/h3[contains(text(),"Kontakti")]/parent::div/parent::header/parent::section//div[@class="row"]/div[2]/div/dl/dd'
    );

    if (dt.length != dd.length) {
        log.error("dd and dt in directors do not match in length");
    }

    // for (let i = 1; i <= dt.length-1; i++) { // this is the old way it worked however there was not innertext error
    let directors = [];
    for (let i = 1; i < dt.length + 1; i++) {
        try {
            let name = await page.evaluate(
                (a) => a.innerText,
                (
                    await page.$x(
                        `//section/header/div/h3[contains(text(),"Kontakti")]/parent::div/parent::header/parent::section//div[@class="row"]/div[2]/div/dl/dd[${i}]`
                    )
                )[0]
            );
            let fullName = await page.evaluate(
                (a) => a.innerText,
                (
                    await page.$x(
                        `//section/header/div/h3[contains(text(),"Kontakti")]/parent::div/parent::header/parent::section//div[@class="row"]/div[2]/div/dl/dd[${i}]/a`
                    )
                )[0]
            );
            let directorLink = await page.evaluate(
                (a) => a.href,
                (
                    await page.$x(
                        `//section/header/div/h3[contains(text(),"Kontakti")]/parent::div/parent::header/parent::section//div[@class="row"]/div[2]/div/dl/dd[${i}]/a`
                    )
                )[0]
            );

            let role = await page.evaluate(
                (a) => a.innerText,
                (
                    await page.$x(
                        `//section/header/div/h3[contains(text(),"Kontakti")]/parent::div/parent::header/parent::section//div[@class="row"]/div[2]/div/dl/dt[${i}]`
                    )
                )[0]
            );
            //add a title text by removing name from full title

            let position = name.replace(fullName, "");
            position = position.replace(",", "");

            directors.push({
                fullTitle: name,
                position: position,
                role: role,
                fullName: fullName,
                directorLink: directorLink,
            });
            // log.info(name);
            // log.info(role);
        } catch (e) {
            log.error(e);
        }
    }
    console.log(directors);
    return directors;
}

async function getXpathText(page, path) {
    return await page.evaluate((el) => el.innerText, (await page.$x(path))[0]);
}
