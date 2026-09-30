import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from "dotenv";
import express from 'express';
import fileUpload from "express-fileupload";
import dbConnect from './config/db.js';
import aiRoutes from "./routes/Ai.js";
import profileRoutes from "./routes/Profile.js";
import userRoutes from "./routes/User.js";
import subscriptionRoutes from "./routes/Subscription.js";
import marketRoutes from "./routes/Market.js";
import portfolioRoutes from "./routes/Portfolio.js";

dotenv.config(); 
dbConnect();
const app=express();

const frontendOrigin = process.env.FRONTEND_URL || "http://localhost:3001";

app.use(
  cors({
    origin: [
      "http://localhost:3001",
      frontendOrigin
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


app.use(fileUpload({
  useTempFiles: true,
  tempFileDir: "/tmp/",
}));


app.use("/api/auth", userRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/subscription", subscriptionRoutes);
app.use("/api/market", marketRoutes);
app.use("/api/portfolio", portfolioRoutes);


app.get('/', (req, res) => {   
  res.send('<h1>Server is Running</h1>');
});

const PORT=process.env.PORT || 3000;


app.listen(PORT,
    ()=>console.log(`Server Started on ${PORT}`)
)


export default app;
