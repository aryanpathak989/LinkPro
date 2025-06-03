require("dotenv").config({})

const express = require('express')
const app = express()
const urlroutes = require("./routes/urlShortner")
const urlReads = require("./routes/url")
const UserRoutes = require('./routes/users')
const linkRoutes = require("./routes/links")
const overviewRoutes = require('./routes/overview')
const cors = require('cors')
const db = require('./lib/database')
const cookieParser = require('cookie-parser');
const passport = require('./config/passport');

const tblUrl = require('./models/TableUrl')
const tblTracking = require('./models/Tracking')
const Users = require('./models/User')
const TableOtps = require('./models/TableOtps')

const PORT = process.env.PORT || 4000

app.use(express.json())  
app.use(cookieParser())
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}))

// Initialize Passport
app.use(passport.initialize())

app.use("/",urlReads)
app.use("/url",urlroutes)
app.use("/user",UserRoutes)
app.use("/dashboard", overviewRoutes)
app.use("/link",linkRoutes)
// app.use("/analysis",analysisRoutes)

// Set up EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', './views');

app.listen(PORT,async ()=>{
    db.sync()
    console.log("Listenig at port "+PORT)
})