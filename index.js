const express = require('express')
const cors = require('cors')
const connectDB = require("./config/db")

const app = express()

app.use(cors());

//connect to db
connectDB();

const PORT = process.env.PORT || 5000

app.listen(PORT, ()=> {
  console.log(`Server is listening on port: ${PORT}`)
})

app.use(express.json({extended: false}));

//define routes
app.use("/api/users", require("./routes/api/users"));
app.use("/api/auth", require("./routes/api/auth"));
app.use("/api/rooms", require("./routes/api/rooms"))

app.get('/', (req, res)=> {
  res.send('Hello world')
})

