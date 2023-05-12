const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const helmet = require('helmet');
const app = express()
const port = process.env.PORT || 3000;

app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"]
  }
}));
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

const verifyJwt = (req, res, next) => {
  const authorization = req.headers.authorization
  if (!authorization) {
    return res.status(401).send({ error: true, message: 'Unauthorized Access' })
  } else {
    const token = authorization.split(' ')[1]
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (error, decoded) => {
      if (error) {
        return res.send({ error: true, error})
      } else {
        req.decoded = decoded;
        next();
      }
    })
  }
}

async function run() {
  try {
    // Connect the client to the server (optional starting in v4.7)
    await client.connect();

    const serviceCollection = client.db('CarDoctor').collection('services')
    const bookingCollection = client.db('CarDoctor').collection('booking')

    //jwt

    app.post('/jwt', (req, res) => {
      const user = req.body
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: '1h'
      })
      res.send({ token })
    })

    //service 

    app.get('/services', async (req, res) => {
      const cursor = serviceCollection.find();
      const result = await cursor.toArray();
      res.send(result)
    })
    app.get('/services/:id', async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) }
        const result = await serviceCollection.findOne(query)
        res.send(result);
      } catch (error) {
        res.send(error.message)
      }
    })

    // booking

    app.post('/bookings', async (req, res) => {
      const booking = req.body;
      const result = await bookingCollection.insertOne(booking)
      res.send(result)
    })
    app.get('/bookings', verifyJwt, async (req, res) => {
      const decoded = req.decoded

      if(decoded.email !== req.query.email){
        return res.status(403).send({ error: 1, message: 'forbidden Access' })
      }

      let query = {};
      if (req.query?.email) {
        query = { email: req.query.email }
      }
      const cursor = bookingCollection.find(query);
      const result = await cursor.toArray();
      res.send(result)
    })
    app.get('/bookings/:id', async (req, res) => {
      try {
        const id = req.params.id
        const query = { _id: new ObjectId(id) }
        const result = await bookingCollection.findOne(query)
        res.send(result)
      } catch (error) {
        res.send(error.message)
      }

    })
    app.put('/bookings/:id', async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) }
        const updatedBooking = req.body
        const update = {
          $set: {
            status: updatedBooking.status
          }
        }
        const result = await bookingCollection.updateOne(query, update)
        res.send(result)
      } catch (error) {
        res.send(error.message)
      }
    })
    app.delete('/bookings/:id', async (req, res) => {
      try {
        const id = req.params.id
        const query = { _id: new ObjectId(id) }
        const result = await bookingCollection.deleteOne(query)
        res.send(result)
      } catch (error) {
        res.send(error.message)
      }
    })
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  }
  catch (error) {
    console.error(error);
  }
}

run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Doctor is running')
})

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
