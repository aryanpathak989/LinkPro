const express = require('express')
const app = express()
const urlroutes = require("./routes/urlShortner")
const urlReads = require("./routes/url")
const UserRoutes = require('./routes/users')
const overviewRoutes = require('./routes/overview')
const cors = require('cors')
const db = require('./lib/database')
const cookieParser = require('cookie-parser');
require("dotenv").config({})


const tblUrl = require('./models/TableUrl')
const tblTracking = require('./models/Tracking')
const Users = require('./models/User')
const TableOtps = require('./models/TableOtps')
//Models


const PORT = process.env.PORT || 4000




app.use(express.json())  
app.use(cookieParser())
app.use(cors())

app.use("",urlReads)
app.use("/url",urlroutes)
app.use("/user",UserRoutes)
app.use("/dashboard", overviewRoutes)
// app.use("/analysis",analysisRoutes)

// Set up EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', './views');

app.listen(PORT,async ()=>{
    db.sync()
    console.log("Listenig at port "+PORT)
})