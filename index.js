const express = require("express");
const app = express();

const cors = require("cors");
app.use(cors());

const bodyParser = require("body-parser");
app.use(bodyParser.json());

const fs = require("fs-extra");

const fileUpload = require("express-fileupload");
app.use(express.static("doctors"));
app.use(fileUpload());

require("dotenv").config();

const port = 5000;

const { MongoClient } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.9wgmh.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
client.connect((err) => {
  const appointmentCollection = client
    .db("doctorsChember")
    .collection("appointments");

  const contactUsCollection = client
    .db("doctorsChember")
    .collection("contacts");

  const doctorCollection = client.db("doctorsChember").collection("doctors");

  app.post("/addAppointment", (req, res) => {
    const appointment = req.body;
    appointmentCollection.insertOne(appointment).then((result) => {
      res.send(result.insertedCount);
    });
  });

  app.get("/appointments", (req, res) => {
    appointmentCollection.find({}).toArray((err, documents) => {
      res.send(documents);
    });
  });

  app.get("/doctors", (req, res) => {
    doctorCollection.find({}).toArray((err, documents) => {
      res.send(documents);
    });
  });

  app.post("/addContactUs", (req, res) => {
    const contactDetails = req.body;
    console.log(contactDetails);
    contactUsCollection.insertOne(contactDetails).then((result) => {
      res.send(result.insertedCount);
    });
  });

  app.post("/appointmentsByDate", (req, res) => {
    const date = req.body;
    const email = req.body.email;
    doctorCollection.find({ email: email }).toArray((err, doctors) => {
      const filter = { date: date.date };
      if (doctors.length === 0) {
        filter.email = email;
      }
      appointmentCollection.find(filter).toArray((err, documents) => {
        //ei line a find(filter) bosale todays patient a kono data show kore na....
        // abar find({ date: date.date }) bosale todays patient a data show kore button
        // localhost:5000/dashboard/appointment a data filter hoye ase na... sob datai show kore
        // jodio seta doctor er mail diye dhukleo
        // console.log(email, date.date, doctors, documents);
        res.send(documents);
      });
    });
  });

  app.post("/addADoctor", (req, res) => {
    const file = req.files.file;
    const name = req.body.name;
    const email = req.body.email;
    // console.log(name, email, file);
    // const filePath = `${__dirname}/doctors/${file.name}`;
    // file.mv(filePath, (err) => {
    //   if (err) {
    //     console.log(err);
    //     return res.status(500).send({ msg: "Failed to upload image" });
    //   }
    const newImg = req.files.file.data;
    const encImg = newImg.toString("base64");

    var image = {
      contentType: req.files.file.mimetype,
      size: req.files.file.size,
      img: Buffer.from(encImg, "base64"),
    };

    doctorCollection
      .insertOne({ name: name, email: email, image })
      .then((result) => {
        // fs.remove(filePath, (error) => {
        //   if (error) {
        //     console.log(error);
        //     res.status(500).send({ msg: "Failed to upload image" });
        //   }
        //   // console.log(result);
        res.send(result.insertedId);
        // });
      });
    // });
  });

  app.post("/isDoctor", (req, res) => {
    const email = req.body.email;
    doctorCollection.find({ email: email }).toArray((err, doctors) => {
      res.send(doctors.length > 0);
    });
  });
});

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(process.env.PORT || port);
