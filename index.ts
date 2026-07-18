import dns from "node:dns";
dns.setServers(["8.8.8.8", "8.8.4.4"]);

import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MongoClient, ServerApiVersion, ObjectId, Collection, Document } from "mongodb";
; 

// Load environment variables
dotenv.config();
const app = express();
const port: string | number = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(express.json());



// MongoDB URI
const uri: string | undefined = process.env.MONGODB_URI;

if (!uri) {
  console.error("❌ MONGODB_URI is missing in .env file");
  process.exit(1);
}

// MongoDB Client
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// Connect Database
async function connectToMongoDB(): Promise<void> {
  try {
    await client.connect();
    console.log("🎉 Successfully connected to MongoDB");
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error);
    process.exit(1);
  }
}

// Main Function
async function startServer(): Promise<void> {
  await connectToMongoDB();

  const db = client.db("travelDB");
  const TravelCollection: Collection<Document> = db.collection("travel");

 // Home Route
  app.get("/", (req: Request, res: Response) => {
    res.send("✈️ Travel Planner Server is Running!");
  });

  // POST: Create a new travel plan
  app.post("/addTravelPlan", async (req: Request, res: Response): Promise<void> => {
    try {
      const travelPlan = req.body;
      const result = await TravelCollection.insertOne(travelPlan);
      
      // সরাসরি insertedId রিটার্ন করা হচ্ছে যাতে ফ্রন্টএন্ডের কন্ডিশন সহজে কাজ করে
      res.status(201).json({ insertedId: result.insertedId });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // GET: Get all travel plans
  app.get("/travelPlans", async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await TravelCollection.find().toArray();
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // GET: Get a specific travel plan by ID
  app.get("/travelPlans/:id", async (req: Request, res: Response): Promise<any> => {
    try {
      const { id } = req.params;
      const result = await TravelCollection.findOne({ _id: new ObjectId(id) });
      if (!result) {
        return res.status(404).json({ message: "Travel plan not found" });
      }
      res.json(result);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // DELETE: Delete a travel plan by ID
  // app.delete("/travelPlans/:id", async (req: Request, res: Response): Promise<void> => {
  //   try {
  //     const id = req.params.id;
  //     const result = await TravelCollection.deleteOne({ _id: new ObjectId(id) });
  //     res.json(result);
  //   } catch (error) {
  //     res.status(500).json({ message: "Internal Server Error" });
  //   }
 // });

  // // GET: Get all travel plans (Note: Your code had duplicate GET /addBook routes. I merged them or kept the standard list one here)
  // app.get("/addTravelPlan", async (req: Request, res: Response): Promise<void> => {
  //   try {
  //     const result = await TravelCollection.find().toArray();
  //     res.json(result);
  //   } catch (error: any) {
  //     res.status(500).json({ success: false, message: error.message });
  //   }
  // });

  // // GET: Get a specific travel plan by ID
  // app.get("/addTravelPlan/:id", async (req: Request, res: Response): Promise<any> => {
  //   try {
  //     const { id } = req.params;
  //     const result = await TravelCollection.findOne({ _id: new ObjectId(id) });
  //     if (!result) {
  //       return res.status(404).send({ message: "Travel plan not found" });
  //     }
  //     res.send(result);
  //   } catch (error) {
  //     console.error(error);
  //     res.status(500).send({ message: "Internal Server Error" });
  //   }
  // });

  // // DELETE: Delete a travel plan by ID
  // app.delete("/addTravelPlan/:id", async (req: Request, res: Response): Promise<void> => {
  //   try {
  //     const id = req.params.id;
  //     const result = await TravelCollection.deleteOne({ _id: new ObjectId(id) });
  //     res.send(result);
  //   } catch (error) {
  //     res.status(500).send({ message: "Internal Server Error" });
  //   }
  // });

  // Start Server
  app.listen(port, () => {
    console.log(`🚀 Server running on http://localhost:${port}`);
  });
}

startServer();

// Gracefully Close MongoDB Connection
process.on("SIGINT", async () => {
  await client.close();
  console.log("🔌 MongoDB connection closed.");
  process.exit(0);
});