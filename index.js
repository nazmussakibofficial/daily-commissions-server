const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);


const port = process.env.PORT || 5000;

const app = express();

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.yxjl2sj.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        const usersCollection = client.db('dailyCommissions').collection('users');
        const artworksCollection = client.db('dailyCommissions').collection('artworks');
        const commissionsCollection = client.db('dailyCommissions').collection('commissions');

        // users

        app.post('/users', async (req, res) => {
            const email = req.body.email;
            const userQuery = {};
            const alreadyRegistered = await usersCollection.find(userQuery).toArray();
            const alreadyRegisteredEmails = alreadyRegistered.map(reg => reg.email)
            if (!alreadyRegisteredEmails.includes(email)) {
                const user = req.body;
                const result = await usersCollection.insertOne(user);
                res.send(result);
            }
        })

        app.get('/artists', async (req, res) => {
            const query = { role: 'Artist' };
            const artists = await usersCollection.find(query).toArray();
            res.send(artists);
        });

        app.get('/user', async (req, res) => {
            const email = req.query.email;
            const query = { email };
            const user = await usersCollection.find(query).toArray();
            res.send(user);
        });

        //artworks

        app.post('/artworks', async (req, res) => {
            const { name, image, category, price, sellerName, sellerEmail, sellerPhoto, isPaid, isCompleted } = req.body;
            const result = await artworksCollection.insertOne({ name, image, category, price, sellerName, sellerEmail, sellerPhoto, isPaid, isCompleted, date: new Date() });
            res.send(result);
        });

        app.get('/artworks', async (req, res) => {
            const query = {};
            const artworks = await artworksCollection.find(query).sort({ "date": -1 }).toArray();
            res.send(artworks);
        });

        app.delete('/artworks/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const result = await artworksCollection.deleteOne(filter);
            res.send(result);
        })

        app.get('/category/:id', async (req, res) => {
            const category = req.params.id;
            const query = { category };
            const artworks = await artworksCollection.find(query).sort({ "date": -1 }).toArray();
            res.send(artworks);
        });

        app.get('/myartworks', async (req, res) => {
            const email = req.query.email;
            const query = { sellerEmail: email };
            const artworks = await artworksCollection.find(query).sort({ "date": -1 }).toArray();
            res.send(artworks);
        });

        app.get('/recent', async (req, res) => {
            const query = {};
            const artworks = await artworksCollection.find(query).limit(3).sort({ "date": -1 }).toArray();
            res.send(artworks);
        });

        // commissions

        app.post('/commissions', async (req, res) => {
            const { name, image, category, price, buyerName, buyerEmail, buyerPhoto, artistEmail, isPaid, isCompleted } = req.body;
            const result = await commissionsCollection.insertOne({ name, image, category, price, buyerName, buyerEmail, buyerPhoto, artistEmail, isPaid, isCompleted, date: new Date() });
            res.send(result);
        });

        app.get('/orders', async (req, res) => {
            const email = req.query.email;
            const query = { buyerEmail: email };
            const commissions = await commissionsCollection.find(query).sort({ "date": -1 }).toArray();
            res.send(commissions);
        });

        app.get('/commissions', async (req, res) => {
            const email = req.query.email;
            const query = { artistEmail: email };
            const commissions = await commissionsCollection.find(query).sort({ "date": -1 }).toArray();
            res.send(commissions);
        });

        app.patch('/commissions/:id', async (req, res) => {
            const id = req.params.id;
            const isCompleted = req.body.isCompleted;
            const isPaid = req.body.isPaid;
            const query = { _id: ObjectId(id) }
            const updatedDoc = {
                $set: {
                    isCompleted,
                    isPaid
                }
            }
            const result = await commissionsCollection.updateOne(query, updatedDoc);
            res.send(result);
        })

    }
    finally {

    }
}

run().catch(e => console.error(e));


app.get('/', async (req, res) => {
    res.send('daily commissions server is running');
})

app.listen(port, () => console.log(`daily commissions server running on ${port}`))