const { MongoClient } = require("mongodb");

const MONGOURL = "mongodb+srv://Cryt:Skyrimrocks123@cryt.dvj2t.mongodb.net/?retryWrites=true&w=majority";
const MONGODB = 'test'



class Mongo {

    error = false
    // client = null
    // collection = null
    // database = null

     constructor() {
            // await this.connect()
            console.log('connect to mongoDB')
            this.connect()
     }

    connect() {

        this.client = new MongoClient(MONGOURL);
        const database = this.client.db('test');
        this.collection = database.collection('CompanyWall');
    } 

    info(){
        return this.collection.MONGOURL
    }
    
    async insert(Object){
        let result =  await this.collection.insertOne(Object)   
        console.log(result) 
    }

    close(){
        this.client.close();
    }

}
module.exports = Mongo