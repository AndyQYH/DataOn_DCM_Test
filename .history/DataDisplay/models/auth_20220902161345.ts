import e, { Response } from "express"
import {schema, db_users} from '../models/db'
import jwt from "jsonwebtoken"
import dotenv from "dotenv"

dotenv.config()

const jwtSecret =
  process.env.TOKEN as string

var adminAuth = (req:any, res:Response, next:any) => {
  console.log(req.headers)
  const token = req.cookies.jwt
  if (token) {
    jwt.verify(token, jwtSecret, (err:any, decodedToken:any) => {
      if (err) {
        return res.status(401).json({ message: "Not authorized" })
      } else {
        if (decodedToken.role !== "admin") {
          return res.status(401).json({ message: "Not authorized" })
        } else {
          next()
        }
      }
    })
  } else {
    return res
      .status(401)
      .json({ message: "Not authorized, token not available" })
  }
}

var userAuth = async (req:any, res:Response, next:any) => {

    const token = req.cookies.jwt
    var msg = ''
    var status = 400
    var url = req.protocol + '://' + req.get('host') + req.originalUrl

    console.log(req.cookies)
    console.log(url)
    console.log(token)

    if(req.params.id != null || req.params.id != undefined){
      console.log('id')
      console.log(req.params.id)
      const result:any = await db_users.get("SELECT * FROM users WHERE username = ?",req.params.id)
    
      console.log(result)
      
      if(!result){
        status = 404
        msg = 'No such route'
      }else{
        if(result.username == 'guest'){
          next()
          return
        }else{
          msg = 'exists'
        }
        
      }

      if(msg != 'exists'){
        return res.render('index',{
          layout:'./layouts/main',
          status:status,
          msg:msg,
          user:''
        })
      }
    }

    if (token) {
      jwt.verify(token, jwtSecret, (err:any, decodedToken:any) => {
        if (err) {
          console.log('error!')
          return res.render('index',{
            layout:'./layouts/main',
            status:401,
            msg:"Not authorized",
            user:''
          })
        } else {
          if (decodedToken.role && decodedToken.role !== "Basic") {
            return res.render('index',{
              layout:'./layouts/main',
              status:401,
              msg:"Not authorized admin",
              user:''
            })
          } else {
            
            next()
          }
        }
      })
    } else {
      console.log('no tokens ...')
      if(url.split('/').slice(-1)[0] != req.params.id){
        return res.status(401).send('Session time out ...')
      }else{
        return res.render('index',{
          layout:'./layouts/main',
          status:401,
          msg:"Not authorized, token not available",
          user:''
        })
      }
      
    }
  }

export {adminAuth,userAuth}