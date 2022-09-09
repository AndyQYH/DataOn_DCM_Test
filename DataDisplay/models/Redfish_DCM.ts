import axios, { AxiosError, AxiosResponse, responseEncoding } from 'axios'
import https from 'https'

//--------------------------------------------------------------------------------------------------------------------
//Utility Functions
//--------------------------------------------------------------------------------------------------------------------

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
        headers:{"Authorization":basicAuth}
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
        console.log(error.message);
      });
}
  
async function Redfish_DCM_Cycle(addresses_global:any, url_dcm:any, basicAuth_dcm:any, basicAuth_redfish:any, target:any){
  let endpoints = [] as Array<string>
  let readData = [] as any

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
    await getBasicRedFish(endpoints,agent,basicAuth_redfish,['PowerState','Model','SerialNumber','IndicatorLED','Boot'])
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
              ...{'IndicatorLED':'','Boot':resp[0]['Boot']}
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
  return readData
}

export {
    getBasicRedFish,
    getConnectionRedFish,
    getConnectionDCM,
    Redfish_DCM_Cycle
}