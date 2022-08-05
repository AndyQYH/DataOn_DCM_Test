import express, {Express, Request, Response} from 'express'
import path from 'path'
import bodyParser from 'body-parser'
import dotenv from 'dotenv'
import axios, { AxiosError, AxiosResponse } from 'axios'


dotenv.config()

const router = express.Router()
router.use(bodyParser.json())

router.get('/',(req:Request, res:Response) =>{
    res.render('index',{
        devices: req.body
    })
})

router.post('/', (req:Request, res:Response) => {
      
    console.log(req.body)
    console.log(typeof req.body)

    let devices = req.body

    res.render('index',{
        devices: devices
    })

});


export default router