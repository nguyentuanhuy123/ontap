const docClient=require("../config/dynamodb");
const { ScanCommand, GetCommand, PutCommand, DeleteCommand, UpdateCommand }=require("@aws-sdk/lib-dynamodb")

const TABLE= process.env.DYNAMODB_TABLE
exports.getAll=async()=>{
    const data=await docClient.send(
        new ScanCommand({TableName:TABLE})
    )
    return data.Items||[]
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

exports.create=async(ticket)=>{
    await docClient.send(
        new PutCommand({
            TableName:TABLE,
            Item:ticket
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
                SET eventName=:eventName,
                price=:price,
                quantity=:quantity,
                imageUrl=:imageUrl
            `,
            ExpressionAttributeValues:{
                ":eventName":data.eventName,
                ":price":Number(data.price),
                ":quantity":Number(data.quantity),
                ":imageUrl":data.imageUrl
            }
        })
    )
}

exports.search=async(keyword)=>{
    const data=await docClient.send(
        new ScanCommand({
            TableName:TABLE,
            FilterExpression:"contains(eventName,:kw)",
            ExpressionAttributeValues:{
                ":kw":keyword
            }
        })
    )
    return data.Items||[]
}