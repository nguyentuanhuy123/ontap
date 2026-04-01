const express=require("express")
const router=express.Router()
const controller=require("../controllers/ticketController")
const upload = require("../middleware/upload")

router.get("/",controller.index)
router.get("/add",controller.showAdd)
router.post("/add", upload.single("image") ,controller.create)

router.get("/delete/:id",controller.delete)
router.get("/edit/:id",controller.showEdit)
router.post("/edit/:id", upload.single("image") ,controller.update)


router.get("/search",controller.search)
router.get("/detail/:id",controller.showDetail)
module.exports=router