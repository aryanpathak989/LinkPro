const express = require('express')
const app = express()
const analysisRoutes = require('./routes/analysis')
const urlroutes = require("./routes/urlShortner")
const cors = require('cors')



const tblUrl = require('./models/TableUrl')
const tblTracking = require('./models/Tracking')
const Users = require('./models/User')
//Models


const PORT = process.env.PORT || 4000


  
app.use(express.json())  
app.use(cors())
app.use("",urlroutes)
app.use("/analysis",analysisRoutes)

app.listen(PORT,()=>{
    // db.sync()
    console.log("Listenig at port "+PORT)
})