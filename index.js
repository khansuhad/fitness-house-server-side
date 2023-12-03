const express = require('express');
const cors = require('cors');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const app = express();
const port = process.env.PORT || 5000 ;

app.use(cors())
app.use(express.json())

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_NAME}:${process.env.DB_PASS}@cluster0.5y6t7ws.mongodb.net/?retryWrites=true&w=majority`;
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
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    const userCollection = client.db("a12DB").collection("users");
    const subscriberCollection = client.db("a12DB").collection("subscribers");
    const forumCollection = client.db("a12DB").collection("forums");
    const appliedTrainerCollection = client.db("a12DB").collection("appliedtrainers");
    const trainerCollection = client.db("a12DB").collection("trainers");
    const newClassCollection = client.db("a12DB").collection("newclasses");
    const bookedClassCollection = client.db("a12DB").collection("bookedclasses");
    const storiesCollection = client.db("a12DB").collection("stories");

    const verifytoken = async(req , res, next) => {
      console.log('verify token' , req.headers.authorization);
      if(!req.headers.authorization){
        return res.status(401).send({message : 'forbidden access'})
      }
      const token = req.headers.authorization.split(' ')[1];
      jwt.verify(token , process.env.ACCESS_TOKEN_SECRET , (err , decoded) => {
        if(err) {
          return res.status(401).send({message : 'forbidden access'})
        }
        req.decoded = decoded ;
        next();
      })
    }

    app.post('/jwt', async(req , res) => {
      const user = req.body ;
      const token = jwt.sign(user , process.env.ACCESS_TOKEN_SECRET , {expiresIn : '1h'})
      res.send({token})
    })

    app.post('/subscribers' , async(req , res) => {
      const subscriber = req.body ;
      const result = await subscriberCollection.insertOne(subscriber);
      res.send(result);
    })

    app.get('/subscribers', verifytoken, async(req , res) => {
        const cursor = subscriberCollection.find();
        const result = await cursor.toArray();
        res.send(result);

    })
    app.get('/users/:_id',verifytoken , async(req , res) => {
      const id = req.params._id ;
      const query = {_id: new ObjectId(id)}
      const result = await userCollection.findOne(query);
      console.log(result);
      res.send(result);
  })
    app.get('/user/:email',verifytoken , async(req , res) => {
      const email = req.params.email ;
      if(email !== req.decoded.email ){
       return res.status(403).send({message : 'unauthorized access' })
      }
      const query = {email : email}
      const user = await userCollection.findOne(query)
      let admin = '';
      if(user){
        admin = user?.role 
      }
      res.send({admin})
  })
  app.patch( '/users/:_id' , async(req , res) => {
    const id = req.params._id;
    console.log(id);
  const filter = { _id : new ObjectId(id)} ;
    const options = { upsert: true };
    const updateUser = req.body ;
    const user = {
        $set: {
         role: updateUser.role,
       },
      };
      const result = await userCollection.updateOne(filter , user , options);
      res.send(result)
    
})
  app.patch( '/users/profile/:_id' , async(req , res) => {
    const id = req.params._id;
    console.log(id);
  const filter = { _id : new ObjectId(id)} ;
    const options = { upsert: true };
    const updateUser = req.body ;
    const user = {
        $set: {
         name :updateUser.name,
         image : updateUser.image
       },
      };
      const result = await userCollection.updateOne(filter , user , options);
      res.send(result)
    
})
    app.get('/users', verifytoken, async(req , res) => {
        const cursor = userCollection.find();
        const result = await cursor.toArray();
        res.send(result);

    })

    app.get('/trainers',  async(req , res) => {
           const cursor = trainerCollection.find();
        const result = await cursor.toArray();
        res.send(result);

    })
     app.post('/trainers', async(req , res) => {
      const trainer = req.body ;
      const result = await trainerCollection.insertOne(trainer);
      res.send(result);
    })
    app.get('/trainers/:email', async(req , res) => {
      const id = req?.params?.email ;
      console.log(id);
    
      const filter = {email: id }
      const result = await trainerCollection.find(filter).toArray();
      console.log(result);
      res.send(result);
  })
    app.get('/newclass/:email', async(req , res) => {
      const id = req?.params?.email ;
      console.log(id);
    
      const filter = {'trainerInfo.email': id }
      const result = await newClassCollection.find(filter).toArray();
      console.log(result);
      res.send(result);
  })
    app.get('/newclass/id/:id', async(req , res) => {
      const id = req?.params?.id ;
      console.log(id);
    
      const filter = {_id: new ObjectId(id) }
      const result = await newClassCollection.findOne(filter);
      console.log(result);
      res.send(result);
  })
  app.get('/newclass/recommanded/class/dashboard', async(req , res) => { 
    result = await newClassCollection.find().sort({$natural: -1 }).limit(8).toArray();

    res.send(result)
})
    app.get('/newclass',  async(req , res) => {
      const cursor = newClassCollection.find();
   const result = await cursor.toArray();
   res.send(result);

})
    app.post('/newclass' , async(req , res) => {

      const classes = req.body ;
      console.log(classes);
      const result = await newClassCollection.insertOne(classes);
      res.send(result);
     } )
     app.get('/bookedclasses/:email',verifytoken, async(req , res) => {
      const id = req?.params?.email ;
      console.log(id);
    
      const filter = {'details.trainerInfo.email' : id }
      const result = await bookedClassCollection.find(filter).toArray();
      console.log(result);
      res.send(result);
  })
     app.get('/bookedclasses/allemail/:email',verifytoken, async(req , res) => {
      const id = req?.params?.email ;
      const query = {'details.trainerInfo.email' : id }
      const options ={
        projection: { _id:0, 'bookedUser.email': 1 },
      }
      const result = await bookedClassCollection.find(query , options).toArray();
      console.log(result);
      res.send(result);
  })

     app.get('/bookedclasses',verifytoken,  async(req , res) => {
      const cursor = bookedClassCollection.find();
   const result = await cursor.toArray();
   res.send(result);

})
     app.get('/bookedclass/:email',verifytoken, async(req , res) => {
      const id = req?.params?.email ;
      console.log(id);
    
      const filter = {'bookedUser.email' : id }
      const result = await bookedClassCollection.find(filter).toArray();
      console.log(result);
      res.send(result);

})
  
app.patch( '/bookedclass/profile/:_id' , async(req , res) => {
  const id = req.params._id;
  console.log(id);
const filter = { _id : new ObjectId(id)} ;
  const options = { upsert: true };
  const updateUser = req.body ;
  const user = {
      $set: {
       'booedUser.name' :updateUser.name,
       'bookedUser.image' : updateUser.image
     },
    };
    const result = await userCollection.updateOne(filter , user , options);
    res.send(result)
  
})
     app.get('/bookedclass/profile/:id',verifytoken,  async(req , res) => {
      const id = req?.params?.id ;
      console.log(id);
    
      const filter = {_id :new ObjectId(id) }
      const result = await bookedClassCollection.findOne(filter);
      console.log(result);
      res.send(result);

})
    app.post('/bookedclasses' , async(req , res) => {

      const classes = req.body ;
      console.log(classes);
      const result = await bookedClassCollection.insertOne(classes);
      res.send(result);
     } )
    app.get('/newstories',  async(req , res) => {
      const query = req?.query;
     const page = parseInt(query.page) ;
     const size = parseInt(query.size) ;
     const skip = page * size ;
      const cursor = storiesCollection.find();
      const result = await cursor.skip(skip).limit(size).toArray();
      res.send(result);

  })

   app.post('/newstories' , async(req , res) => {
    const user = req.body ;
    const result = await storiesCollection.insertOne(user);
    res.send(result);
   } )
    app.get('/newforums',  async(req , res) => {
      const query = req?.query;
     const page = parseInt(query.page) ;
     const size = parseInt(query.size) ;
     const skip = page * size ;
      const cursor = forumCollection.find();
      const result = await cursor.skip(skip).limit(size).toArray();
      res.send(result);

  })

   app.post('/newforums' , async(req , res) => {
    const user = req.body ;
    const result = await forumCollection.insertOne(user);
    res.send(result);
   } )
   app.get('/appliedtrainers',verifytoken, async(req , res) => {
    const cursor = appliedTrainerCollection.find();
    const result = await cursor.toArray();
    res.send(result);

})
 app.delete('/appliedtrainers/:_id' , async(req , res) => {
    const id = req.params._id;
    const query = {_id : new ObjectId(id)};
    const result = await appliedTrainerCollection.deleteOne(query);
    res.send(result)

})
  app.get('/appliedtrainers/:_id',verifytoken, async(req , res) => {
    const id = req.params._id ;
    const query = {_id: new ObjectId(id)}
    const result = await appliedTrainerCollection.findOne(query);
    res.send(result);
})
   app.post('/appliedtrainers' , async(req , res) => {
    const appliedTrainer = req.body ;
    const result = await appliedTrainerCollection.insertOne(appliedTrainer);
    res.send(result);
   } )
    app.post('/users' , async(req , res) => {
        const user = req.body ;
        const query = {email : user.email}
        const existingUser = await userCollection.findOne(query);
        if(existingUser){
            return res.send({message:"user already exists" , insertedId : null})
        }
        const result = await userCollection.insertOne(user);
        res.send(result);
    })
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    // console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req ,res) => {
    res.send('database is coming soon of fitness house....')
})
app.listen(port , (req ,res) => {
    console.log(`database is running successfully , PORT : ${port}`);
})