const docClient = require("../config/dynamodb")
const { GetCommand, ScanCommand, PutCommand, DeleteCommand, UpdateCommand } = require("@aws-sdk/lib-dynamodb")

const TABLE=process.env.DYNAMODB_TABLE

exports.getAll=async()=>{
    const data=await docClient.send(
        new ScanCommand({
            TableName:TABLE
        })
    )
    return data.Items||[];
}

exports.getById=async(id)=>{
    const data=await docClient.send(
        new GetCommand({
            TableName:TABLE,
            Key:{ticketId:id}
        })
    )
    return data.Item;
}

exports.search=async(keyword, status)=>{
    if(!keyword&&!status) return exports.getAll();
    let filter=[]
    let names={}
    let values={}

    if(keyword){
        filter.push("(contains(eventName, :kw) or contains(holderName, :kw))")
        values[":kw"]=keyword.trim()
    }
    if(status){
        filter.push("#st = :st")
        values[":st"]=status.trim()
        names["#st"]="status"
    }
    const params={
            TableName:TABLE,
            FilterExpression:filter.length===2?
                filter.join(" and "):filter[0],
            ExpressionAttributeValues:values
    }
    if(Object.keys(names).length>0){
        params.ExpressionAttributeNames=names
    }
    const data=await docClient.send(
        new ScanCommand(params)
    )
    return data.Items||[];
}

exports.create=async(tikcet)=>{
    await docClient.send(
        new PutCommand({
            TableName:TABLE,
            Item:tikcet
        })
    )
}

exports.delete=async(id)=>{
    await docClient.send(
        new DeleteCommand({
            TableName:TABLE,
            Key:{ticketId:id}
        })
    )
}

exports.update=async(id,data)=>{

    await docClient.send(
        new UpdateCommand({
            TableName:TABLE,
            Key:{ticketId:id},
            UpdateExpression:`
                SET eventName= :eventName, 
                holderName = :holderName, 
                category = :category, 
                quantity = :quantity,
                pricePerTicket = :pricePerTicket, 
                eventDate = :eventDate, 
                #status = :status, 
                imageUrl = :imageUrl
            `,
            ExpressionAttributeNames:{
                "#status":"status"
            },
            ExpressionAttributeValues:{
                ":eventName" :data.eventName, 
                ":holderName"  :data.holderName, 
                ":category"  :data.category, 
                ":quantity"  :Number(data.quantity),
                ":pricePerTicket"  :Number(data.pricePerTicket), 
                ":eventDate"  :data.eventDate, 
                ":status"  :data.status, 
                ":imageUrl" :data.imageUrl
            }
        })
    )
}
