import {Act} from './act.mjs';
import express from "express";
import fs from "fs";

const textConfig = fs.readFileSync('./config.json');
const config = JSON.parse(textConfig)
const port = config.port; 
const host = config.host;
const app = express();

app.route('/act').get(async (request, response)=>{
    const actIdParam = request.query.act_id;
    const actId = parseInt(actIdParam);

    if(isNaN(actId) || actId<=0){
        response.json({error:"Указан недопустимый act_id"}).end()
        return;
    } 
    
    let actUrlResponse = null;
    try{
        const act = new Act(actId);
        actUrlResponse = await act.print()
        response.json(actUrlResponse)
    }catch(e){
        response.json({error: e.message})
    }
    response.end();

})

app.listen(port, host, ()=>{
    console.log(`Server listens http://${host}:${port}`);
})