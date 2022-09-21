const { MongoClient } = require("mongodb");

const MONGOURL = "mongodb+srv://Cryt:Skyrimrocks123@cryt.dvj2t.mongodb.net/?retryWrites=true&w=majority";
const MONGODB = 'test'



exports.module = class Mongo {

    error = false
    

     constructor() {
            // await this.connect()
            console.log()
     }

    async connect() {

        this.client = new MongoClient(MONGOURL);
        const database = client.db('test');
        this.collection = database.collection('CompanyWall');
    } 

    async insert(Object){
        await this.collection.insertOne(Object)   
    }

    close(){
        this.client.close();
    }

}