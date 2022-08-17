import express, {Express, Request, Response} from 'express'
import bodyParser from 'body-parser'
import dotenv from 'dotenv'
import axios, { AxiosError, AxiosResponse, responseEncoding } from 'axios'
import fs, { readdir } from 'fs'
import {stringify} from 'csv-stringify'
import { parse } from "csv-parse"
import https from 'https'
import cookieParser from 'cookie-parser'

dotenv.config()

//variables declarations
//----------------------------------------------------------------------------------------------------------
let devices = [] as any
let addresses_selected = {} as any
let addresses_global = [] as any
let sessions = [] as any
const labels = ['Node','BMC IP address','Status','Model','Serial Number','Indicator LED','CPU','Memory','IO','Power']
const target = ['10.4.7.43','10.4.7.79']
const csv = "DCM_Data.csv"
const path = process.env.PATH_CSV
const username_dcm = process.env.USRNAME_DCM as string
const password_dcm = process.env.PASSWORD_DCM as string
const username_redfish = process.env.USRNAME_REDFISH as string
const password_redfish = process.env.PASSWORD_REDFISH as string
const credentials_dcm =   Buffer.from(username_dcm + ":"+ password_dcm).toString('base64')
const credentials_redfish =   Buffer.from(username_redfish + ":"+ password_redfish).toString('base64')
var basicAuth_dcm = 'Basic ' + credentials_dcm;
var basicAuth_redfish = 'Basic ' + credentials_redfish;
const delay = (ms:any) => new Promise(resolve => setTimeout(resolve, ms))
console.log(basicAuth_dcm)
console.log(basicAuth_redfish)

const url_dcm = process.env.URL_DCM_HOST as string + ":" + process.env.URL_DCM_PORT as string + process.env.URL_DCM_SOURCE as string

//--------------------------------------------------------------------------------------------------------------------------------
//Router Functions
//--------------------------------------------------------------------------------------------------------------------------------
const router = express.Router()
router.use(cookieParser())
router.use(bodyParser.json())

router.get('/', async(req:Request, res:Response) =>{

    console.log('request cookie:')
    console.log(req.cookies)
    //console.log(req.headers)
    addresses_global = [] as any
    let readData = [] as any
    let endpoints = [] as Array<string>

    const agent = new https.Agent({  
      rejectUnauthorized: false
    })
    
    //First getting all available devices from the DCM, specifically IP addresses and name

    //retry if having trouble making connection until success
    //return on timeout
    var error = true
    
    while(error){
      console.log("Trying request to DCM ...")
      await getConnectionDCM(url_dcm,agent,basicAuth_dcm,readData,addresses_global,['name','address','powerStatus','model','serialNumber'])
      .then((response:any)=>{
        error = response
      })
      console.log(error)
    }
    
  
    console.log("after DCM request")
    console.log("combining data with Redfish Schema ...")
    console.log("fetching device status, metrics ...")
    //console.log(readData)

    //format IP addresses into usable links for Redfish API
    //Redfish format: https://$host/redfish/v1/Systems
    addresses_global.forEach((address:string)=>{
      if(target.includes(address)){
        let temp = process.env.URL_REDFISH_HOST + "://" + address + process.env.URL_REDFISH_SOURCE
        endpoints.push(temp)
      }
    })
    //Naviagate to /Systems page to retrieve serial number for further access to detailed info.
    error = true
    
    while(error){
      console.log("trying to connect to Redfish ...")
      await getConnectionRedFish(endpoints, agent, basicAuth_redfish).then((resp:any)=>{
        if(resp){
          error = false
          endpoints = resp
        }
      })
      console.log(error)
    }
    //console.log(endpoints)

    //Get Info like power status, model, serial from the /systems/$serialnumber page

    //retry if having trouble making connection until success
    //return on timeout
    error = true

    while(error){
      console.log("trying connection to Redfish ...")
      await getBasicRedFish(endpoints,agent,basicAuth_redfish,['PowerState','Model','SerialNumber','IndicatorLED','boot'])
      .then((resp:any)=>{
        if(resp){
          error = false
          let count = 0
          for(var i = 0; i < readData.length;i++){
            if(target.includes(readData[i]['address'])){
              console.log("inside if")
              let temp  = { 
                ...readData[i],
                ...resp[count++]
              }
              readData[i] = temp

              delete readData[i]['powerStatus']
              delete readData[i]['model']
              delete readData[i]['serialNumber']
            }else{
              let temp  = { 
                ...readData[i],
                ...{'IndicatorLED':''}
              }
              readData[i] = temp
            }
          }
        }
      })
      console.log(error)
    }
        
      
    //Getting the metrics evaluation from the /Systems/$serialnumber/Metrics page
    //Redfish format: https://$host/redfish/vs/Systems/Metrics
    for(var j = 0; j < endpoints.length;j++){
      endpoints[j] = endpoints[j] + "/Metrics"
    }
    
    //retry if having trouble making connection until success
    //return on timeout
    error = true
    while(error){
      console.log("trying connection to Redfish ...")
      await getBasicRedFish(endpoints,agent,basicAuth_redfish,['ProcessorBandwidthPercent','MemoryBandwidthPercent','IOBandwidthGBps']).then((resp:any)=>{
        if(resp){
          error = false
          let count = 0
          for(var i = 0; i < readData.length;i++){
            if(target.includes(readData[i]['address'])){
              console.log("inside if")
              let temp  = { 
                ...readData[i],
                ...{'ProcessorBandwidthPercent':resp[count]['ProcessorBandwidthPercent']+"%",
                    'MemoryBandwidthPercent':resp[count]['MemoryBandwidthPercent']+"%",
                    'IOBandwidthGBps':resp[count]['IOBandwidthGBps']+"GBps"
                  }
              }
              readData[i] = temp
              count++
              
            }else{
              let temp  = { 
                ...readData[i],
                ...{'ProcessorBandwidthPercent':'','MemoryBandwidthPercent':'','IOBandwidthGBps':''}
              }
              readData[i] = temp
            }
          }
        }
      })
      console.log(error)
    }
    
    //Finally, getting the Power Consumption
    const regex = new RegExp('Systems\/.*$')
    for(var j = 0; j < endpoints.length;j++){
      endpoints[j] = endpoints[j].replace(regex,'Chassis/RackMount/Baseboard/Power')
    }
    
    error = true

    while(error){
      console.log("trying connection to Redfish ...")
      await getBasicRedFish(endpoints,agent,basicAuth_redfish,['PowerControl']).then((resp:any)=>{
          if(resp){
            error = false
            let count = 0
            for(var i = 0; i < readData.length;i++){
              if(target.includes(readData[i]['address'])){
                console.log("inside if")
                let temp  = { 
                  ...readData[i],
                  ...{"PowerConsumedWatts":resp[count++]['PowerControl'][0]['PowerConsumedWatts']+"W"}
                }
                readData[i] = temp
              }else{
                let temp  = { 
                  ...readData[i],
                  ...{"PowerConsumedWatts":''}
                }
                readData[i] = temp
              }
            }
          }
      })
      console.log(error)
    }
    //console.log(readData)
    
    devices = readData
    //console.log(devices)

    if(devices.length > 0){
      res.render('index',{
        labels: labels,
        devices: devices,
        sessions:sessions
      })
    }else{
      console.log("can not get web response, loading from local database instead ...")
      console.log("current data might be outdated, try refreshing for updates...")
      readFromCsv(path+csv, res, labels, devices)
    }
    
})

//router to handle post requests on / page
router.post('/', (req:Request, res:Response) => {

    let host = req.headers.host
    console.log("inside post")
    console.log(host)
    console.log('request cookie:')
    console.log(req.cookies)

    if(host=="localhost:3000"){
    }
    /*
    stringify(req_data,{header:true, columns:labels},function(err, output){
        fs.writeFile(path+csv,output,"utf8", (err) => {
            if (err)
              console.log(err);
            else
              console.log("File written successfully\n");
              console.log("The written has the following contents:");
              //console.log(fs.readFileSync(path+csv, "utf8"));
            })
    })
    */
    res.send("received data")
});

router.get('/bootdevices', (req:Request, res:Response) => {
    
    let temp = addresses_selected
    
    res.send(temp)
});

router.post('/bootdevices', async(req:Request, res:Response) => {

    var resp
    let req_data = req.body
    addresses_selected = req_data
    console.log(req_data)
    console.log("posted")
    console.log(req_data['sessions'])
    res.cookie("sessions", req_data['sessions'],{maxAge: 60000})

    const agent = new https.Agent({  
      rejectUnauthorized: false
    })
    
    await axios.post("http://localhost:5000", req_data, {
      httpsAgent: agent,
      headers:{"Authorization":basicAuth_redfish}
    })
    .then((response) => {
      resp = response.data
      console.log(resp)
      if(resp == undefined || resp == null){
        resp = "error-server"
      }
    }).catch((err)=>{
      console.log(err)
    })

    res.send(resp)
});


//--------------------------------------------------------------------------------------------------------------------
//Utility Functions
//--------------------------------------------------------------------------------------------------------------------
function readFromCsv(path:string, res:Response,labels:any, devices:any){
  fs.createReadStream(path)
        .pipe(parse({ delimiter: ",", from_line: 2 }))
        .on("data", function (row) {
            let temp = {} as any
            //console.log(row);
            for(let i = 0; i < row.length; i++){
                temp[labels[i]] = row[i]
            }
            devices.push(temp)
            
        })
        .on("end", function () {
            //console.log('devices')
            //console.log(devices)
            res.render('index',{
                labels: labels,
                devices: devices,
                sessions:sessions
            })

            console.log("finished rendering");
        })
        .on("error", function (error) {
            console.log(error.message);
        });
}

async function getConnectionRedFish(urls:any, agent:any, basicAuth:any){
  return Promise.allSettled(urls.map((url:string) => axios.get(url,
    { 
      httpsAgent: agent ,
      headers:{"Authorization":basicAuth}
    })
  )).then((response) => {
    if(response){
      let newEndPoints= [] as Array<string>
      response.forEach((device:any)=>{
            let host = device['value']['request'].host
            let temp = process.env.URL_REDFISH_HOST + "://" + host + device['value']['data']['Members'][0]['@odata.id']
            newEndPoints.push(temp)
      })
      return newEndPoints
    }    
  }).catch((err)=>{
    console.log(err)
  })
}

async function getBasicRedFish(urls:any, agent:any, basicAuth:any, labels:any){
  return Promise.allSettled(urls.map((url:string) => axios.get(url,
    { 
      httpsAgent: agent ,
      headers:{"Authorization":basicAuth}
    })
  )).then((response:any) => {
    
    let temps = [] as Array<JSON>

    response.forEach((device:any)=>{
      let temp = {} as any
      labels.forEach((label:any)=>{
         temp[label] = device['value']['data'][label]
      })
      temps.push(temp)
    })
    return temps
  }).catch((err)=>{
    console.log(err)
  })
}

async function getBasicRedFishAxios(urls:any, agent:any, basicAuth:any, labels:any){
  return axios.all(urls.map((url:string) => axios.get(url,
    { 
      httpsAgent: agent ,
      headers:{"Authorization":basicAuth_redfish}
    })
  )).then((response:any) => {
    
    let temps = [] as Array<JSON>

    response.forEach((device:any)=>{
      let temp = {} as any
      labels.forEach((label:any)=>{
         temp[label] = device['data'][label]
      })
      temps.push(temp)
    })
    return temps
  }).catch((err)=>{
    console.log(err)
  })
}

async function getConnectionDCM(url:any, agent:any, basicAuth:any, readData:any,addresses:any,labels:any){
  return axios.get(url, 
    { 
      httpsAgent: agent,
      headers:{"Authorization":basicAuth}
    }).then(function(response){
      let response_data = response.data['content']
      let temp:any
      response_data.forEach((device:any)=>{
        temp = {} as any
        labels.forEach((label:string)=>{
          temp[label] = device[label]
        })
        
        readData.push(temp)
        addresses.push(temp['address'])
      })
      return false
    }).catch(function (error) {
      console.log("error:")
      console.log(error.toJSON());
    });
}

export default router