require("dotenv").config()
const express=require("express")
const path=require("path")
const ticketRoutes=require("./routes/ticketRoutes")
const app=express()

app.set("view engine","ejs")
app.set("views",path.join(__dirname,"views"))

app.use(express.urlencoded({extended:true}))
app.use(express.json())
app.use(express.static("public"))
app.use("/",ticketRoutes)

app.listen(3000,()=>{
    console.log("server running at http://localhost:3000")
})