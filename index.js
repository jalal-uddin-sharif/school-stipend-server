const express = require("express");
const app = express();
const port = process.env.PORT || 5000;
require("dotenv").config();
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

app.use(express.json());
app.use(
  cors({
    origin: ["https://shs-stipend.netlify.app", "http://localhost:5173"],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  })
);

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.zukg64l.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    // console.log(
    //   "Pinged your deployment. You successfully connected to MongoDB!"
    // );

    //crud from here
    const StudentsPaymentCollection = client
      .db("Government-Stipend")
      .collection("Students-Payment-Info");
    //insert user payment information
    app.post("/students-payment", async (req, res) => {
      const StudentsPaymentData = req.body;
      console.log(StudentsPaymentData);

      // Check if the same data already exists in the database
      const existingData = await StudentsPaymentCollection.findOne({
        roll: StudentsPaymentData.roll,
        class: StudentsPaymentData.class,
        section: StudentsPaymentData.section,
        terms: StudentsPaymentData.terms,
      });

      if (existingData) {
        res
          .status(400)
          .send({
            message: "Payment information for this student already exists.",
          });
      } else {
        const result = await StudentsPaymentCollection.insertOne(
          StudentsPaymentData
        );
        res.send(result);
      }
    });

    app.get("/students-payment", async (req, res) => {
      const { class: className, terms, section, status } = req.query;
    
      try {
        // Create a dynamic query object
        let query = {
          class: className,
          terms: terms,
        };
    
        // Check if section is 'All', otherwise add it to the query
        if (section !== "All") {
          query.section = section;
        }
    
        // Check if status is 'All', otherwise add it to the query
        if (status !== "All") {
          query.status = status;
        }
    
        console.log(query);
        // Fetch data from the database based on the dynamic query
        const result = await StudentsPaymentCollection.find(query).toArray();
    
        // Sort results to have paid first and then unpaid
        const sortedResult = result.sort((a, b) => {
          // Compare status: "paid" comes before "unpaid"
          if (a.status === 'paid' && b.status === 'unpaid') return -1;
          if (a.status === 'unpaid' && b.status === 'paid') return 1;
          return 0; // if both are the same status or both are neither
        });
    
        console.log(sortedResult);
        // Send the sorted result back to the client
        res.send(sortedResult);
      } catch (err) {
        console.error("Error fetching data", err);
        res.status(500).send({ message: "Error fetching data" });
      }
    });

    app.get("/all-payments-data", async(req, res)=>{
      const result = await StudentsPaymentCollection.find().toArray()
      res.send(result)
    })

    //delete data
    app.delete('/delete-data/:id', async(req, res)=>{
      const result = await StudentsPaymentCollection.deleteOne({
        _id: new ObjectId(req.params.id)
      })
      res.send(result)
    })
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Server is running");
});

app.listen(port, () => {
  console.log(`server is running on port: ${port}`);
});
