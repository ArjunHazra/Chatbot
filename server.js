require("dotenv").config();
const express = require("express");
const path = require("path");
const multer = require("multer");

const fs = require("fs");
const {GoogleGenerativeAI} = require("@google/generative-ai");
const app = express();
const uploads = multer({dest: "uploads/"});
if(!process.env.GEMINI_API_KEY){
    console.error("Error : GEMINI_API_KEY is missing the API key");
    process.exit(1);
}
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const BOT_NAME = "ASSZ";
const DEVELOPER_NAME = "Arjun Hazra,Suhas Bhat,Mohammad Saahil,Zahid Shariff"; // Add this line

app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.post("/get", uploads.single("file"), async (req, res) => { 
    const userInput = req.body.msg;
    const file = req.file;
    try {
        const model = genAI.getGenerativeModel({model:"gemini-2.5-flash"});
        let parts = [];
        if (userInput) {
            // Add bot and developer name to the prompt
            parts.push({text: `You are ${BOT_NAME}, a chatbot developed by ${DEVELOPER_NAME}. ${userInput}`});
        }
        if (file) {
            const fileData = fs.readFileSync(file.path);
            parts.push({
                inlineData: {
                    data: fileData.toString("base64"),
                    mimeType: file.mimetype,
                }
            });
        }
        const result = await model.generateContent({
            contents: [
                {
                    role: "user",
                    parts: parts
                }
            ]
        });
        res.send(result.response.text());
    } catch (error) {
        console.error("Error generating content:", error);
        res.status(error.status || 500).send(error.message || "An error occurred while processing your request.");
    } finally {
        if (file) {
            fs.unlink(file.path, () => {});
        }
    }
});
const PORT = process.env.PORT || 3000
app.listen(PORT,() =>{
    console.log(`Server running at http://localhost:${PORT}`);
})
