import express, {Express, Request, Response} from 'express'
import bodyParser from 'body-parser'
import dotenv from 'dotenv'
import axios, { AxiosError, AxiosResponse } from 'axios'
import https from 'https'
import cookieParser from 'cookie-parser'
import { userAuth } from '../models/auth'
import { db_users } from '../models/db'
import {sessionAuth} from '../models/auth_session'

dotenv.config()

let addresses_selected = {} as any
let passwords = [] as any
let sessions = [] as any
var username_redfish:any
var password_redfish:any
var credentials_redfish:any
var server = process.env.SERVER_URL as string
const jwtSecret = process.env.TOKEN as string

const router = express.Router({mergeParams: true})
router.use(bodyParser.json())
router.use(cookieParser())

router.get('/', userAuth,(req:Request, res:Response) => {
    
    let temp = addresses_selected
    
    res.send(temp)
});

router.post('/', userAuth,sessionAuth, async(req:Request, res:Response) => {

    var resp
    var token = req.cookies.jwt

    console.log("posted in device actions ...")
    addresses_selected = req.body
    console.log(req.body)
    console.log(req.body.credentials)
    console.log(req.body.sessions)

    

    if(req.body.credentials != null && req.body.credentials != undefined && req.body.credentials.length > 0){
      console.log('for redfish scripting')
      var req_data = req.body
      var maxAge = 1 * 60
      var date:any

      console.log('params')
      console.log(req.params)
      

      var [username_redfish, ...date] = req.body.credentials[0].split(':')
      date = date.join(':').replace(' ', '')
      console.log(username_redfish)
      console.log(date)
      const decode:any = await db_users.get('SELECT * FROM sessions WHERE user = ? AND username = ? AND date = ?',[req.params.id,username_redfish,date])
      password_redfish = decode.password
      console.log('password_redfish')
      console.log(password_redfish)

      credentials_redfish = Buffer.from(username_redfish + ":"+ password_redfish).toString('base64')

      var basicAuth_redfish = 'Basic ' + credentials_redfish;

      req_data['credentials'] = [username_redfish,password_redfish]

      const agent = new https.Agent({  
        rejectUnauthorized: false
      })
      
      await axios.post(server, req_data, {
        httpsAgent: agent,
        headers:{"Authorization":basicAuth_redfish}
      })
      .then((response) => {
        resp = response.data
        console.log(resp)
        if(resp == undefined || resp == null){
          resp = "error-server"
        }else{
          res.cookie(req.params.id, username_redfish+":"+ date, {
            httpOnly: true,
            maxAge: maxAge, // 3hrs in ms
          });
        }
        
      }).catch((err)=>{
        if(err){
          res.cookie(basicAuth_redfish, username_redfish, {
            httpOnly: true,
            maxAge: 1, // 3hrs in ms
          });
        }
        console.log(err)
      })

      res.send(resp)
    }else if(req.body.sessions != null && req.body.sessions != undefined && req.body.sessions.length > 0){
      sessions = req.body.sessions
      passwords = req.body.passwords
      console.log("sessions")
      console.log(sessions)
      console.log("passwords")
      console.log(passwords)
    }else{
      console.log('other commands')
    }
    
});



export default router