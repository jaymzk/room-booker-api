const express = require('express')
const connectDB = require("./config/db");

const app = express()

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

app.get('/', (req, res)=> {
  res.send('Hello world')
})

