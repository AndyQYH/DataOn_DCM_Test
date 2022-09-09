import express, {Express, Request, Response} from 'express'
import bodyParser from 'body-parser'
import cookierParser from 'cookie-parser'
import dotenv from 'dotenv'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import sqliteDB, {db_users,schema} from '../models/db_old'
import cookieParser from 'cookie-parser'
import {userAuth} from '../models/auth'

dotenv.config()

let msg = ''
let user = ''
let table = 'users' 
let cols = schema[table]
let jwtSecret = process.env.TOKEN as string

db_users.db.serialize(async function(){
  db_users.dropTable(table)
  db_users.createTable(table,cols)
  let hash = await bcrypt.hash('123', 10)
  db_users.insertDB(table,['123@123.com', '123', hash])
  db_users.insertDB(table,['', 'guest', ''])
  db_users.logTable(table) 
  
})

const router = express.Router()
router.use(bodyParser.urlencoded({ extended: false }))
router.use(bodyParser.json())
router.use(express.static('public'))
router.use(cookieParser())

router.get('/',(req:Request, res:Response) => {

    console.log('welcome to Login ...')

    if(req.cookies){
      console.log('has cookies')
      console.log(req.cookies)
      user = req.cookies.user
    }else{
      user = ''
    }

  console.log('user now is:')
  console.log(user)
    
    res.render('user-login',{
        layout:'./layouts/users',
        userAction:'Log in',
        user: user
    })

});

router.post('/', async(req:Request, res:Response) => {

    console.log("posted in login ...")

    console.log("got log-in post", req.body)

    const {username, password} = req.body

    if (username && password) {

      db_users.db.get("SELECT * FROM users WHERE username = ? OR email = ? LIMIT 1", [username,username], async function(err, row){
        if(!row){
          msg = 'username/email does not exist!'
          console.log(msg)
          res.status(400).send(msg)
        } else if(err){
          msg = err.message
          console.log(msg)
          res.status(500).send(msg)
        }else {
          const validPass = await bcrypt.compare(password, row.password)
          if(!validPass){
            msg = 'incorrect username/password'
            console.log(msg)
            res.status(400).send(msg)
          }else{
            const maxAge = 5 * 60 
            const token = jwt.sign(
              { id: row.id, username},
                jwtSecret,
              {
                expiresIn: maxAge, // 3hrs in sec
              }
            );
            console.log(token)
            res.cookie("jwt", token, {
              httpOnly: true,
              maxAge: maxAge * 1000, // 3hrs in ms
            });

            res.cookie('user',username,{
              httpOnly: true,
              maxAge: 3 * 60 * 1000
            })
            
            msg = 'successfully logged in!'
            console.log(msg)
            res.status(200).json({msg:msg,user:username})
          }
          
        }
      })
    } else {
      res.send("username and password are required");
    }

});

router.get('/register', (req:Request, res:Response) => {

  console.log('welcome to Register ...')

  if(req.cookies){
    console.log(req.cookies)
    user = req.cookies.user
  }else{
    user = ''
  }

  console.log('user now is:')
  console.log(user)

  res.render('user-register',{
      layout:'./layouts/users',
      userAction:'Sign up',
      user:user
  })

});

router.post('/register', async(req:Request, res:Response) => {

  const {username, password, email} = req.body
  console.log("posted in register ...")

  console.log("got register post", req.body)

  if (username && password && email) {
    console.log('verifying registration  ...')
    const password_hash = await bcrypt.hash(password, 10)
    db_users.db.get("SELECT * FROM users WHERE username = ? OR email = ? LIMIT 1", [username,email], function(err, row){
      if(row){
        msg = 'username/email already in use!'
        console.log(msg)
        res.status(400).send(msg)
      } else if(err){
        msg = err.message
        console.log(msg)
        res.status(401).send(msg)
      }else {
        db_users.insertDB(table,[email,username,password_hash])
        msg = 'success'
        console.log(msg)
        res.status(200).send(msg)
      }
    })
    
  } else {
    res.send("username and password are required");
  }
  

});

export default router