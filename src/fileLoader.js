const fs = require("fs");

const FILE_NAME = "";

module.exports = class FileLoader {
    constructor() {}

    loadFile() {
        fs.readFile(FILE_NAME, "utf8", (err, data) => {
            if (err) {
                console.error(err);
                return;
            }
            return data
        });
    }

    // This is specific for single line URLS 
    parseData(data) {
         
    }
};
