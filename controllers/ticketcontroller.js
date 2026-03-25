const model=require("../models/ticketModel")
const { uploadToS3, deleteFromS3 } = require("../config/s3")
const { v4 }=require("uuid")

exports.index=async(req,res)=>{
    const tickets=await model.getAll();
    res.render("index",{tickets});
}

exports.showAdd=(req,res)=>{
    res.render("add")
}

exports.create=async(req,res)=>{
    let imageUrl="";
    if(req.file){
        imageUrl=await uploadToS3(req.file)
    }
    console.log(req.file)
    const ticket={
        ticketId: v4(),
        eventName:req.body.eventName,
        price:Number(req.body.price),
        quantity:Number(req.body.quantity),
        imageUrl
    }
    await model.create(ticket)
    res.redirect("/")
}
exports.delete=async(req,res)=>{
    const ticket=await model.getById(req.params.id)
    await deleteFromS3(ticket.imageUrl)
    await model.delete(req.params.id)
    res.redirect("/")
}

exports.showEdit=async(req,res)=>{
    const ticket =await model.getById(req.params.id)
    res.render("edit",{ticket})
}

exports.update=async(req,res)=>{
    let imageUrl= req.body.oldImage;
    if(req.file){
        await deleteFromS3(req.body.oldImage)
        imageUrl=await uploadToS3(req.file)
    }
    await model.update(req.params.id,{
        eventName:req.body.eventName,
        price:req.body.price,
        quantity:req.body.quantity,
        imageUrl
    })
    res.redirect("/")
}

exports.search=async(req,res)=>{
    const tickets =await model.search(req.query.keyword)
    res.render("index",{tickets})
}