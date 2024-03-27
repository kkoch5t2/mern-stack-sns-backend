const express = require("express");
const app = express();
const userRoute = require("./routes/users");
const authRoute = require("./routes/auth");
const postsRoute = require("./routes/posts");
const uploadRoute = require("./routes/upload");
const PORT = 5000;
const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config();

// データベース
mongoose.connect(process.env.MONGO_URL)
.then(() => {
    console.log("DBと接続中");
}).catch((err)=>{
    console.log(err);
})
;

// ミドルウェア
app.use("/images", express.static(path.join(__dirname, "public/images")))
app.use(express.json());
app.use("/api/users", userRoute);
app.use("/api/auth", authRoute);
app.use("/api/posts", postsRoute);
app.use("/api/upload", uploadRoute);

app.get("/api/search", (req, res) =>{
    console.log("aaa");
    res.send("users express!");
});

app.get("/api/search2", async (req,res) => {
    const param = req.query.q
    console.log(param);
    try{
        return res.send(`Hello, ${param}`);
    } catch(err) {
        return res.send("エラー")
    }
});

app.listen(PORT, () => console.log("サーバーが起動しました"));
