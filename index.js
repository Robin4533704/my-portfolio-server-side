import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import nodemailer from "nodemailer";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// ✅ CORS setup
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://my-portfolio-server-nu-eosin.vercel.app", "https://astounding-griffin-1653d5.netlify.app",
    ],
    credentials: true,
      optionsSuccessStatus: 200,
  })
);

app.use(express.json());

// ✅ MongoDB Connection
const uri = `mongodb+srv://${encodeURIComponent(process.env.DB_USER)}:${encodeURIComponent(
  process.env.DB_PASS)}@cluster0.dvaruep.mongodb.net/portfolio?retryWrites=true&w=majority`;

mongoose
  .connect(uri)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Error:", err));

// ✅ MongoDB Schema
const contactSchema = new mongoose.Schema({
  name: String,
  email: String,
  message: String,
  createdAt: { type: Date, default: Date.now },
});
const Contact = mongoose.models.Contact || mongoose.model("Contact", contactSchema);

// ✅ Nodemailer Transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ✅ Verify transporter
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ Email Transporter Error:", error);
  } else {
    console.log("✅ Email Transporter Ready");
  }
});

app.get("/", (req, res) => {
  res.send("ping your portfolio API is running");
});

app.get('/contact', (req, res) => {
  res.json({ message: "Contact API is working" });
});
// ✅ Contact Form API
app.post("/contact", async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    // Save to MongoDB
    const newContact = new Contact({ name, email, message });
    await newContact.save();

    // Send email
    await transporter.sendMail({
      from: `"Portfolio Contact" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: `New message from ${name}`,
      text: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`,
    });

    res.status(200).json({ message: "Message sent successfully!" });
  } catch (error) {
    console.error("❌ Contact API Error:", error);
    res.status(500).json({ error: "Server error, try again later." });
  }
});

// ✅ Start Server
app.listen(port, () => console.log(`🚀 Server running on port ${port}`));
