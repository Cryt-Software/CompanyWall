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

    let url = page.url();
    console.log(url);
    if (await checkForRegisterPage(page)) {
        console.error("it is register page");
        return; // this needs to be use new proxy
    } else {
        console.log("Not register page");
    }

    await getContactDetails(page);

    await handleBusinessName(page);
    await handleMainBusinessDetails(page);
    await handleDirectors(page);
    await handleBusinessDetails(page);
    await getFinancialData(page);
    await handleBusinessAddress(page);
    await handleBusinessName(page);
    await handleBusinessSummary(page);

    await page.waitFor(30000);
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

async function checkForRegisterPage(page) {
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

    if (page.url() == "https://www.companywall.hr/Account/RegisterOpenUser") {
        console.log("the page url is true");
        return true;
    }
    if (page.url() == "https://www.companywall.hr/Account/Login") {
        console.log("Asking for login page, failed need new proxy");
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
