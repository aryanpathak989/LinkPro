const express = require('express')
const app = express()
// const db = require('./lib/database')
const tblUrl = require('./models/TableUrl')
const tblTracking = require('./models/Tracking')
const urlroutes = require("./routes/urlShortner")
const cors = require('cors')

const PORT = process.env.PORT || 4000


  
app.use(express.json())  
app.use(cors())
app.use("",urlroutes)

app.listen(PORT,()=>{
    // db.sync()
    console.log("Listenig at port "+PORT)
})