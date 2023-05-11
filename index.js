const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express()
const port = process.env.PORT || 3000;

app.use(cors())
app.use(express.json())

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.jjaqgwq.mongodb.net/?retryWrites=true&w=majority`;

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
    // Connect the client to the server (optional starting in v4.7)
    await client.connect();

    const serviceCollection = client.db('CarDoctor').collection('services')
    const bookingCollection = client.db('CarDoctor').collection('booking')

    app.get('/services', async (req, res)=>{
        const cursor = serviceCollection.find();
        const result = await cursor.toArray();
        res.send(result)
    })
    app.get('/services/:id', async (req, res) =>{
        const id = req.params.id;
        const query = {_id : new ObjectId(id)}
        const result = await serviceCollection.findOne(query)
        res.send(result);
    })

    // booking

    app.post('/bookings', async (req, res)=>{
        const booking = req.body;
        const result = await bookingCollection.insertOne(booking)
        res.send(result)
    })
    app.get('/bookings', async (req, res)=>{
      let Query = {};
      if(req.query?.email){
        Query = {email : req.query.email}
      }
        const cursor = bookingCollection.find(Query);
        const result = await cursor.toArray();
        res.send(result)
    })
    app.get('/bookings/:id', async (req, res) =>{
      const id = req.params.id
      const query = {_id : new ObjectId(id)}
      const result = await bookingCollection.findOne(query)
      res.send(result)
    })
    app.put('/bookings/:id', async (req, res) =>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const updatedBooking = req.body
      const update = {
        $set : {
          status : updatedBooking.status
        }
      }
      const result = await bookingCollection.updateOne(query, update)
      res.send(result)
    })
    app.delete('/bookings/:id', async (req, res) =>{
      const id = req.params.id
      const query = {_id : new ObjectId(id)}
      const result = await bookingCollection.deleteOne(query)
      res.send(result)
      // console.log(result)
    })
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  }
  catch (error){
    console.error(error);
  }
}

run().catch(console.dir);

app.get('/', (req, res)=>{
    res.send('Doctor is running')
})

app.listen(port, ()=>{
    console.log(`Server is running on port ${port}`);
});
