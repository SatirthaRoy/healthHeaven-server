const express = require('express');
const cors = require('cors')
const { MongoClient, ServerApiVersion } = require('mongodb');

require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// used middlewares
app.use(express.json());
app.use(cors());


// middlewares




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@mydatabase.ofrvnz1.mongodb.net/?retryWrites=true&w=majority&appName=mydatabase`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    const database = client.db("HealthHeaven");
    const users = database.collection("users");
    const shop = database.collection('shop');
    const categories = database.collection('categories');
    const cart = database.collection('cart');

    // --------------------------------USER-----------------------------------//
    // add user to users collection
    app.post('/users', async(req, res) => {
      const user = req.body;
      const result = await users.insertOne(user);
      res.send(result);
    })

    // dont add same uid user again and again
    app.get('/users/:id', async(req, res) => {
      const userId = req.params.id;
      const result = await users.findOne({uid: userId});
      if(result) {
        res.send({isInData: true})
      } else {
        res.send({isInData: false})
      }
    })

    // get users data 
    app.get('/users', async(req, res) => {
      const userId = req.query.id;
      const result = await users.findOne({uid: userId});
      res.send(result);
    })


    // ---------------------------------SHOP------------------------------------//


    // add items in shop
    app.post('/addtoshop', async(req, res) => {
      const item = req.body;
      const result = await shop.insertOne(item);
      res.send(result);
    })

    // get all shop items or shopitems by seller uid
    app.get('/shop', async(req, res) => {
      const id = req.query.id;
      if(id) {
        const result = await shop.find({sellerUid: id}).toArray();
        return res.send(result);
      } 
      const allShopItems = await shop.find().toArray();
      return res.send(allShopItems);
    })

    // get shop items by category
    app.get('/shop/category/:category', async(req, res) => {
      const category = req.params.category;
      const result = await shop.find({category: category}).toArray();
      res.send(result);
    })

    // get shop items that has discounts
    app.get('/shop/discounts', async(req, res) => {
      const result = await shop.find({discount: {$ne: 0}}).toArray();
      res.send(result);
    })


    // -------------------------------CATEGORIES-----------------------------------------//
    // get categories
    app.get('/categories' , async(req, res) => {
      const result = await categories.find().toArray();
      res.send(result);
    })

    // get estimated items count of categories
    app.get('/category/:category', async(req, res) => {
      const categoryName = req.params.category;
      const result =  await shop.find({category: categoryName}).toArray();
      res.send(result);
    })

    // ------------------------------------CART---------------------------------------------//
    // add item to cart
    app.post('/addcart', async(req, res) => {
      const itemData = req.body;
      const findResult = await cart.findOne({$and: [{itemId: itemData.itemId}, {userId: itemData.userId}]});
      if(findResult) {
        const query = {$and: [{itemId: itemData.itemId}, {userId: itemData.userId}]};
        const result = await cart.updateOne(query, {$inc: {quantity: 1}});
        res.send(result);
      } else {
        const result = await cart.insertOne(itemData);
        res.send(result);   
      }
    })

    // get item from cart querying by userId
    app.get('/getcart/:id', async(req, res) => {
      const uid = req.params.id;
      const result = await cart.find({userId: uid}).toArray();
      res.send(result);
    })




    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);




app.listen(port, () => console.log('server is running on port: ', port))