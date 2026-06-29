import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from "dotenv";
import express from 'express';
import fileUpload from "express-fileupload";
import nodemailer from "nodemailer";
import { cloudinaryConnect } from "./config/cloudinary.js";
import dbConnect from './config/db.js';
import aiRoutes from "./routes/Ai.js";
import profileRoutes from "./routes/Profile.js";
import userRoutes from "./routes/User.js";
import subscriptionRoutes from "./routes/Subscription.js";
//import projectRoutes from "./routes/Project.js";

dotenv.config(); 
dbConnect();
const app=express();

app.use(
  cors({
    origin: [
      "http://localhost:3001",
      "https://zelbi-ai-powered-investment-dashboard.netlify.app"
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  })
);
cloudinaryConnect();

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


app.get('/', (req, res) => {   
  res.send('<h1>Hello</h1>');
});

app.get("/test", async (req, res) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: 587,
      secure: false,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

    await transporter.verify();

    res.send("SMTP OK");
  } catch (err) {
    console.error(err);
    res.send(err.message);
  }
});
const PORT=process.env.PORT || 3000;


app.listen(PORT,
    ()=>console.log(`Server Started on ${PORT}`)
)


export default app;
