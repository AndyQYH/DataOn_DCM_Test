import express, {Express, Request, Response} from 'express'
import bodyParser from 'body-parser'
import dotenv from 'dotenv'
import axios, { AxiosError, AxiosResponse } from 'axios'
import cookieParser from 'cookie-parser'
import sqliteDB, {db_users, schema} from '../models/db'
import jwt from 'jsonwebtoken'
import { userAuth } from '../models/auth'

dotenv.config()

let sessions = [] as any
const server = process.env.SERVER_URL as string
let table = 'sessions' 
let cols = schema[table]
let user = ''

db_users.db.serialize(function(){
  db_users.dropTable(table)
  db_users.createTable(table,cols)
  db_users.insertDB(table,['guest','admin','admin1','any','anytime admin'])
  db_users.insertDB(table,['123','guest user','any','any','something'])
  db_users.insertDB(table,['123','guest user','any','any','random'])
  db_users.logTable(table)
})

const router = express.Router({mergeParams: true})
router.use(bodyParser.urlencoded({ extended: false }))
router.use(bodyParser.json())
router.use(cookieParser())

router.get('/', userAuth, async (req:Request, res:Response) => {

    if(req.cookies){
        console.log('has cookies')
        console.log(req.cookies)
        user = req.cookies.user
    }else{
        user = ''
    }
    
    const temp = await db_users.all(`SELECT * FROM ${table} WHERE user = ? ORDER BY ?`, [user,'username'])
    
    res.send(temp)
});

router.post('/', userAuth, async(req:Request, res:Response) => {

    console.log("posted in sessions")

    console.log(req.body)

    if(req.cookies){
        console.log('has cookies')
        console.log(req.cookies)
        user = req.cookies.user
      }else{
        user = ''
      }

    if(req.body.username){
        const {username,password,device,date} = req.body

        const row = await db_users.get(`SELECT * FROM ${table} WHERE user = ? AND username = ? AND password = ?`, [req.params.id,username,password])
        
        
        if (row) {
        //response validate data to register.ejs
            console.log('has errors!')
            res.status(401).send('Issues encountered when creating session... Try different username/password...')
        }else{
            console.log('successfully created session ...')
            var maxAge = 3 * 60 

            db_users.insertDB(table,[user,username,password,device,date])

            res.cookie(username + ':' + date, user,  {
                httpOnly: true,
                maxAge: maxAge * 1000, // 3hrs in ms
            })

            res.status(200).send('success')
        }
    }else if(req.body.username_disabled){
        const {username_disabled,password,device,date} = req.body

        const row = await db_users.get(`SELECT * FROM ${table} WHERE user = ? AND username = ? AND password = ?`, [req.params.id,username_disabled,password])

        if (!row) {
            //response validate data to register.ejs
                console.log('has errors!')
                res.status(401).send('Issues encountered when loggin into session... Try again...')
            }else{
                console.log('successfully logged into session ...')
                var maxAge = 3 * 60 
    
    
                res.cookie(username_disabled + ':' + date,req.params.id,  {
                    httpOnly: true,
                    maxAge: maxAge * 1000, // 3hrs in ms
                })
    
                res.status(200).send('success')
            }

    }else{
        console.log('error!')
        res.status(400).send('An error has ocurred, try again later ...')
    }
    
});

export default router