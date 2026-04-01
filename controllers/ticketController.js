const { v4 } = require("uuid")
const { uploadToS3, deleteFromS3 } = require("../config/s3")
const model=require("../models/ticketModels")
exports.index=async(req ,res)=>{
    const tickets=await model.getAll()
    res.render("index",{tickets})
}

exports.showAdd=async(req ,res)=>{
    
    res.render("add")
}

exports.showEdit=async(req ,res)=>{
    const ticket=await model.getById(req.params.id)
    res.render("edit",{ticket})
}

exports.showDetail=async(req ,res)=>{
    const ticket=await model.getById(req.params.id)
    res.render("details",{ticket})
}

exports.create=async(req ,res)=>{
    let imageUrl=""
    if(req.file) imageUrl=await uploadToS3(req.file);

    const ticket={
        ticketId:v4(),
        eventName :req.body.eventName, 
                holderName  :req.body.holderName, 
                category  :req.body.category, 
                quantity  :Number(req.body.quantity),
                pricePerTicket  :Number(req.body.pricePerTicket), 
                eventDate  :req.body.eventDate, 
                status  :req.body.status, 
                imageUrl,
                createAt:Date.now()
    }
    await model.create(ticket)
    res.redirect("/")
}

exports.update=async(req ,res)=>{
    let imageUrl=req.body.oldImage;
    if(req.file){
        if(req.body.oldImage) await deleteFromS3(req.body.oldImage)
        imageUrl=await uploadToS3(req.file);
    }
    await model.update(req.params.id,{
        ...req.body,
                quantity  :Number(req.body.quantity),
                pricePerTicket  :Number(req.body.pricePerTicket), 
                
                imageUrl
    })
    await model.create(ticket)
    res.redirect("/")
}

exports.delete=async(req ,res)=>{
    const ticket=await model.getById(req.params.id)
    if(ticket?.imageUrl) await deleteFromS3(ticket.imageUrl);
    await model.delete(req.params.id)

    res.redirect("/")
}

exports.search=async(req ,res)=>{
    const {keyword, status}=req.query
    const tickets=await model.search(keyword,status)
    res.render("index",{tickets})
}