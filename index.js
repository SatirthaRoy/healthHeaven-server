const express = require('express');
const cors = require('cors')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_KEY)

const app = express();
const port = process.env.PORT || 5000;

// used middlewares
app.use(express.json());
app.use(cors({
  origin: ['http://localhost:5173', 'https://health-heaven.web.app']
}));


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
    const queries = database.collection('queries');
    const shop = database.collection('shop');
    const categories = database.collection('categories');
    const cart = database.collection('cart');
    const sold = database.collection('sold');
    const payments = database.collection('payments');
    const Ads = database.collection('Ads');

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

    // get users data to get role
    app.get('/users', async(req, res) => {
      const userId = req.query.id;
      const result = await users.findOne({uid: userId});
      res.send(result);
    })

    // get all users data for admin
    app.get('/allusers', async(req, res) => {
      const result = await users.find().toArray();
      res.send(result);
    })

    // change user role
    app.patch('/user/:uid', async(req, res) => {
      const userId = req.params.uid;
      const query = {uid: userId};
      const updatedDoc = {
        $set: {
          role: req.body.role
        }
      }
      const result = await users.updateOne(query, updatedDoc);
      res.send(result);
    })

    // --------------------------------------------QUERIES------------------------------------------//
    // post a query
    app.post('/query', async(req,res) => {
      const data = req.body;
      const result = await queries.insertOne(data);
      res.send(result);
    })

    // get users queries
    app.get('/query/:id', async(req, res) => {
      const userId = req.params.id;
      const result = await queries.find({userId: userId}).toArray();
      res.send(result);
    })

    // get queries and specific queries
    app.get('/queries', async(req,res) => {
      const result = await queries.find().toArray();
      res.send(result);
    })

    // get specific query
    app.get('/queries/:id', async(req,res) => {
      const id = req.params.id;
      const result = await queries.findOne({_id: new ObjectId(id)});
      res.send(result);
    })

    // add reply to query
    app.put('/query/:id/reply', async(req, res) => {
      const id = req.params.id;
      const replyData = req.body;
      const query = {_id: new ObjectId(id)};
      const updatedDoc= {
        $push: {replies: replyData}
      }

      const result = await queries.updateOne(query, updatedDoc);
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

    // add category
    app.post('/addcategory', async(req, res) => {
      const categoryData = req.body;
      const result = await categories.insertOne(categoryData);
      res.send(result);
    })

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

    // update a category
    app.patch('/updatecategory/:id', async(req, res) => {
      const id = req.params.id;
      const query = {_id: new ObjectId(id)};
      const updatedDoc = {
        $set: {
          categoryName: req.body.categoryName,
          categoryImage: req.body.categoryImage
        }
      }
      const result = await categories.updateOne(query, updatedDoc);
      res.send(result);
    })

    // delete a category
    app.delete('/deletecategory/:id', async(req, res) => {
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const result = await categories.deleteOne(query);
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

    // cart item quantity increase
    app.patch('/cart/:action', async(req, res) => {
      const data = req.body;
      const action = req.params.action;
      if(action === 'increase') {
        const query = {$and : [{itemId: data.itemId}, {sellerUid: data.sellerUid}, {userId: data.userId}]}
        const result = await cart.updateOne(query, {$inc: {quantity: 1}});
        return res.send(result);
      } else {
        const query = {$and : [{itemId: data.itemId}, {sellerUid: data.sellerUid}, {userId: data.userId}]};
        const result =  await cart.updateOne(query, {$inc: {quantity: -1}});
        return res.send(result)
      }
    })

    // delete item from cart
    app.delete('/cart/delete', async(req, res) => {
      const itemId = req.query.itemId;
      const sellerUid = req.query.sellerUid;
      const userId = req.query.userId;
      const query = {$and : [{itemId: itemId}, {sellerUid: sellerUid}, {userId: userId}]};
      const result = await cart.deleteOne(query);
      res.send(result);
    })


    // clear cart using uid
    app.delete('/cart/:uid', async(req, res) => {
      const userId = req.params.uid;
      const result = await cart.deleteMany({userId: userId})
      res.send(result);
    })

    // ----------------------------------------------------ADVERTISEMENTS--------------------------------------//
    // add advertisement
    app.post('/addAd', async(req, res) => {
      const data = req.body;
      const result = await Ads.insertOne(data);
      res.send(result);
    })

    // get ads
    app.get('/ads/:id', async(req, res) => {
      const query = {sellerUid : req.params.id}
      const result = await Ads.find(query).toArray();
      return res.send(result);
    })

    // get all ads
    app.get('/ads', async(req, res) => {
      const result = await Ads.find().toArray();
      return res.send(result);
    })

    // toggle ad to add
    app.patch('/adstoggle/:id', async(req, res) => {
      const query = {_id: new ObjectId(req.params.id)};
      const findResult = await Ads.findOne(query);
      let updatedDoc = {};
      if(findResult.status === 'not added') {
        updatedDoc = {
          $set: {
            status: 'added'
          }
        }
      } else {
        updatedDoc = {
          $set: {
            status: 'not added'
          }
        }
      }

      const result = await Ads.updateOne(query, updatedDoc);
      res.send(result);

    })

    // get only the added ads
    app.get('/addedAds', async(req, res) => {
      const query = {status: 'added'};
      const result = await Ads.find(query).toArray();
      res.send(result);
    })


    // ------------------------------------------------SOLD-------------------------------------------------//
    app.post('/sold', async(req, res) => {
      const soldData = req.body;
      const options = { ordered: true };
      const result = await sold.insertMany(soldData, options);
      res.send(result);
    })

    // get all sold data
    app.get('/allsold', async(req, res) => {
      const result = await sold.find().toArray();
      res.send(result);
    })

    // get sold data by transactionId
    app.get('/soldData', async(req, res) => {
      const userId = req.query.uid;
      const transactionId = req.query.transactionId;
      const query = {$and: [{userId: userId}, {transactionId: transactionId}]}
      const result = await sold.find(query).toArray();
      res.send(result);
    })

    // get sellers product solds
    app.get('/sold/:id', async(req,res) => {
      const id = req.params.id;
      const query = {sellerUid: id};
      const result = await sold.find(query).toArray();
      res.send(result);
    })

    // ------------------------------------- PAYMENTS HISTORY-------------------------------------//
    // send data to payments
    app.post('/payments', async(req, res) => {
      const data = req.body;
      const result = await payments.insertOne(data);
      res.send(result);
    })

    // get payments data
    app.get('/getpayments', async(req, res) => {
      const result = await payments.find().toArray();
      res.send(result);
    })

    // get payment data by userId
    app.get('/getpayments/:id', async(req, res) => {
      const userId = req.params.id;
      const result = await payments.find({userId: userId}).toArray();
      res.send(result);
    })

    // update payment status
    app.patch('/payment/:transactionId', async(req, res) => {
      const transactionId = req.params.transactionId;
      const query = {transactionId: transactionId};
      const updatedDoc = {
        $set: {
          status: 'paid'
        }
      }
      // patch sold items status
      const soldResult = await sold.updateMany(query, updatedDoc);
      // patch payments status
      const result = await payments.updateOne(query, updatedDoc);
      res.send(result);
    })





    // -------------------------------------PAYMENTS -------------------------------------------------//
    // payment intent
    app.post('/create-payment-intent', async(req, res) => {
      const {price} = req.body;
      const amount = (Number(price) * 100).toFixed(0);
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: 'usd',
        payment_method_types: ['card']
      })
      res.send({
        clientSecret: paymentIntent.client_secret
      })
    })


    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);




app.listen(port, () => console.log('server is running on port: ', port))