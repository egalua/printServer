import {Act} from './act.mjs';
import http from 'http';
import fs from "fs";


function onServer(){
    const config = fs.readFileSync('./config.json');
    const cfg = JSON.parse(config)
    const host = cfg.host;
    const port = cfg.port;
    const requestListener = async (req, res)=>{
        
        const requestUrl = `http://${req.headers.host}${req.url}`
        const url = new URL(requestUrl);
        const actId = url.searchParams.get('act_id');
        const actIdNum = parseInt(actId);
        if(isNaN(actIdNum)){
            const err = {error:'Указан не допустимый идентификатор акта'}

            res.setHeader("Content-Type", "application/json");
            res.write(JSON.stringify(err));
            res.end();
        } else {
            let actUrlJSON = null;
            try{
                const act = new Act(actIdNum);
                const actUrlResponse = await act.print();
                // console.log('act = ',act)
                // console.log('actUrlResponse = ',actUrlResponse);
                actUrlJSON = JSON.stringify(actUrlResponse)    
            }catch(e){
                actUrlJSON = null;
                res.setHeader("Content-Type", "application/json");
                res.write(JSON.stringify({error:e.message}));
                res.end();    
            }
            if(actUrlJSON!==null){
                res.setHeader("Content-Type", "application/json");
                res.write(actUrlJSON);
                res.end();
            }
            
        }
        
    }

    const server = http.createServer(requestListener);
    server.listen(port, host, ()=>{console.log(`Сервер запущен по адресу http://${host}:${port}`)});
    
    
}

onServer();