const Apify = require("apify");

const {
    utils: { log },
} = Apify;
const main = require("../main");

exports.handleStart = async ({ request, page }) => {
    // Handle Start URLs
    // if(main.OIBsIndex > main.OIBs.length) {
    // return;
    // }

    await page.waitFor(300);
    // not working
    // if (checkForRegisterPage(page)) {
    //     console.error("it is register page");
    //     return;
    // }

    // await getContactDetails(page);
    await handleBusinessName(page);
    await handleMainBusinessDetails(page);
    await handleDirectors(page);
    await handleBusinessDetails(page);
    await getFinancialData(page);
    await handleBusinessAddress(page);
    await handleBusinessName(page);
    await handleBusinessSummary(page);
};

exports.handleList = async ({ request, page }) => {
    // Handle pagination
};

exports.handleDetail = async ({ request, page }) => {
    // Handle details
};

async function handleBankDetails(page) {
    //Računi i blokade
    //check if there
    // check other company wall to see if works
}

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

async function handleBusinessName(page) {
    let name = await helperGetInnerText(page, "//h1");
    console.log(`The business name is ${name}`);
    return {
        BusinessName: name,
    };
}

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

async function helperGetInnerText(page, xpath) {
    let text = ''
    try {
         text= await page.evaluate(
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

async function checkForRegisterPage(page) {
    try {
        element = await page.waitForSelector(
            "#main-content > div > div.col.pr-7-5 > section > header > div > h3"
        );

        title = await page.evaluate((element) => element.textContent, element);

        if (title == "Registrirajte se za besplatan pristup") {
            console.log("the title is true");
            return true;
        }
    } catch (e) {
        console.log("error getting title");
    }

    if (page.url() == "https://www.companywall.hr/Account/RegisterOpenUser") {
        console.log("the page url is true");
        return true;
    }

    return false;
}

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
}

async function getContactDetails(page) {
    // Not sure which one to do

    // try {
    //     let response = await page.evaluate(
    //         (span) => span.click(),
    //         await page.$x(
    //             "//section/header/div/h3[contains(text(),'Kontakti')]/parent::div/parent::header/parent::section//div[@class='col-12 col-lg-6 br-1']//div[@class='d-inline']//button
    //         )[0]
    //     );
    //     console.log(typeof response)
    //     console.log(response)

    // } catch (e) {
    //     console.log(e);
    // }
    let xpath =
        "//section/header/div/h3[contains(text(),'Kontakti')]/parent::div/parent::header/parent::section//div[@class='col-12 col-lg-6 br-1']//div[@class='d-inline']//button";

    // await page.click('#main-content > div:nth-child(4) > div.col-12.col-xl-6.pr-7-5.d-flex.contact-summary > section > div > div > div.col-12.col-lg-6.br-1 > div > dl > dd:nth-child(4) > div > button')
    // await page.waitFor(3000)
    // const text = await page.evaluate(() => Array.from(document.querySelectorAll('[data-test-foo4="true"]'), element => element.textContent));

    const elements = await page.$$(xpath);
    await elements[0].click();
}

// TODO needs a bit of work
//and get links for directors

/*
[
  { 'Žarko Šepetavc (NP), jedini osnivač d.o.o.': 'Vlasnik' },
  { 'Žarko Šepetavc prokurist': 'Zastupnik' },
  { 'Snježana Šepetavc direktor': 'Zastupnik' }
]

*/
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

            let role = await page.evaluate(
                (a) => a.innerText,
                (
                    await page.$x(
                        `//section/header/div/h3[contains(text(),"Kontakti")]/parent::div/parent::header/parent::section//div[@class="row"]/div[2]/div/dl/dt[${i}]`
                    )
                )[0]
            );
            directors.push({ [name]: role });
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
