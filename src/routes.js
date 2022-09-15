const Apify = require('apify');

const { utils: { log } } = Apify;
const main = require('../main')

exports.handleStart = async ({ request, page }) => {
    // Handle Start URLs
    // if(main.OIBsIndex > main.OIBs.length) {
        // return;
    // }
    
    await page.waitFor(30)
    await handleDirectors(page) 

    await page.waitFor(200)


    
    // await page.waitForXPath("//input[contains(@id, 'OIB')]");

    // let OIBInput = await page.$x("//input[contains(@id, 'OIB')]");
    // await OIBInput[0].click({ clickCount: 3 })
    // // await OIBInput[0].type( main.OIBs[main.OIBsIndex++] )
    // await OIBInput[0].type('67694519791')
    // console.log(`the oib is ${main.OIBs[main.OIBsIndex]}`)
    
};

exports.handleList = async ({ request, page }) => {
    // Handle pagination
};

exports.handleDetail = async ({ request, page }) => {
    // Handle details




};
async function handleBusinessDetails(page){

    // data comes in flat array of even size, with odd numbers being identifer and even being data

    let data = await page.$x('//section/header/div/h3[contains(text(),"Osnovni podaci")]/parent::div/parent::header/parent::section/div[@class="container-fluid"]/dl')
    
    for (let i = 0; i <= data.length; i+2){
        try {
            let title = `//section/header/div/h3[contains(text(),"Osnovni podaci")]/parent::div/parent::header/parent::section/div[@class="container-fluid"]/dl//dt[${i}]`

            let data = `//section/header/div/h3[contains(text(),"Osnovni podaci")]/parent::div/parent::header/parent::section/div[@class="container-fluid"]/dl//dt[${i+1}]`

            log.info(title)
            log.info(data)

        } catch(e){
            log.error(e)
        }
    }


}

async function handleDirectors(page){
   // ROW: //section/header/div/h3[contains(text(),"Kontakti")]/parent::div/parent::header/parent::section//div[@class="row"]/div[2]/div/dl
   // director ROLE : //section/header/div/h3[contains(text(),"Kontakti")]/parent::div/parent::header/parent::section//div[@class="row"]/div[2]/div/dl/dt
   // Director Name: //section/header/div/h3[contains(text(),"Kontakti")]/parent::div/parent::header/parent::section//div[@class="row"]/div[2]/div/dl/dd
   
   // First we must get the list of dt and dd elements text then we know their names and roles

    let dt = await page.$x('//section/header/div/h3[contains(text(),"Kontakti")]/parent::div/parent::header/parent::section//div[@class="row"]/div[2]/div/dl/dt')
    let dd = await page.$x('//section/header/div/h3[contains(text(),"Kontakti")]/parent::div/parent::header/parent::section//div[@class="row"]/div[2]/div/dl/dd')

    if (dt.length != dd.length){
    log.error('dd and dt in directors do not match in length')
    }
    
    for (let i = 0; i <= dt.length; i++){
        try{
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
            log.info(name)
            log.info(role)
        }catch(e){
            log.error(e)
        }
    }


}


async function getXpathText(page, path) {
    return await page.evaluate(
        (el) => el.innerText,
        (
            await page.$x(path)
        )[0]
    );
}
