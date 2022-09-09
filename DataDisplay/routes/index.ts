import express, {Express, Request, Response} from 'express'
import bodyParser from 'body-parser'
import dotenv from 'dotenv'
import cookieParser from 'cookie-parser'
import deviceRouter from './devices'
import sessionRouter from './sessions'
import {schema, db_users} from '../models/db'
import {
  getBasicRedFish,
  getConnectionRedFish,
  getConnectionDCM,
  Redfish_DCM_Cycle
} from '../models/Redfish_DCM'
import {userAuth} from '../models/auth'

dotenv.config()

//variables declarations
//----------------------------------------------------------------------------------------------------------
let devices = [] as any
let addresses_global = [] as any
let sessions = [] as any
let user = '' as any
const labels = ['Node','BMC IP address','Status','Model','Serial Number','Indicator LED','CPU','Memory','IO','Power']
const target = ['10.4.7.43','10.4.7.79']
const username_dcm = process.env.USRNAME_DCM as string
const password_dcm = process.env.PASSWORD_DCM as string
const username_redfish = process.env.USRNAME_REDFISH as string
const password_redfish = process.env.PASSWORD_REDFISH as string
const credentials_dcm =   Buffer.from(username_dcm + ":"+ password_dcm).toString('base64')
const credentials_redfish =   Buffer.from(username_redfish + ":"+ password_redfish).toString('base64')
var basicAuth_dcm = 'Basic ' + credentials_dcm;
var basicAuth_redfish = 'Basic ' + credentials_redfish;
console.log(basicAuth_dcm)
console.log(basicAuth_redfish)

const url_dcm = process.env.URL_DCM_HOST as string + ":" + process.env.URL_DCM_PORT as string + process.env.URL_DCM_SOURCE as string

//--------------------------------------------------------------------------------------------------------------------------------
//Router Functions
//--------------------------------------------------------------------------------------------------------------------------------
const router = express.Router()
router.use(cookieParser())
router.use(bodyParser.json())
router.use('/:id/sessions',sessionRouter)
router.use('/:id/device-actions',deviceRouter)
router.use(express.static('public'))

router.get('/:id',userAuth, async(req:any, res:Response) =>{
    
    addresses_global = [] as any

    if(req.cookies){
      console.log('has cookies')
      console.log(req.cookies)
      user = req.params.id
    }else{
      user = ''
    }

    console.log('user now is:')
    console.log(user)

    await Redfish_DCM_Cycle(addresses_global,url_dcm,basicAuth_dcm,basicAuth_redfish,target).then((resp)=>{
      //console.log(resp)
      devices = resp
    })

    sessions = await db_users.all(`SELECT * FROM sessions WHERE user = ?`,user)
    //console.log(devices)
    console.log('sessions')
    console.log(sessions)

    if(devices.length > 0 && sessions != undefined){
      res.render('index',{
        labels: labels,
        devices: devices,
        sessions:sessions,
        status:200,
        user:user
      })
    }else{
      console.log("can not get web response, loading from local database instead ...")
      console.log("current data might be outdated, try refreshing for updates...")
      res.render('index',{
        labels: labels,
        devices: [],
        sessions:[],
        status:200,
        user:user
      })
    }
    
})

//router to handle post requests on / page
router.post('/:id', (req:Request, res:Response) => {

    let host = req.headers.host
    let errors = []
    var password
    var username
    var device 
    var date
    console.log("inside post")
    console.log(host)

    console.log('POST in Index:')
    console.log(req.body)


    if(req.body.errors){
      errors = req.body
    }

    if(req.body){
      username = req.body.username
      password = req.body.password
      device = req.body.device
      date = req.body.date
    }
    


    res.send('received')
    
});

router.get("/:id/sign-out", (req, res) => {
  res.cookie("jwt", "", { maxAge: 1 })
  res.cookie("user", "", { maxAge: 1 })
  res.redirect("/")
})


export default router