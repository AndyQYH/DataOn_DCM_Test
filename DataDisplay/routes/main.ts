import express, {Express, Request, Response} from 'express'
import bodyParser from 'body-parser'
import dotenv from 'dotenv'
import {userAuth} from '../models/auth'
import cookieParser from 'cookie-parser'


dotenv.config()

let path = process.env.PATH_CSV as string
let user = ''


const router = express.Router()
router.use(bodyParser.urlencoded({ extended: false }))
router.use(bodyParser.json())
router.use(express.static('public'))
router.use(cookieParser())

router.get('/', (req:Request, res:Response) => {

    console.log('Welcome to main page ...')

    if(req.cookies){
        console.log('has cookies')
        console.log(req.cookies)
        user = req.cookies.user
    }else{
        user = ''
    }

    console.log('user now is:')
    console.log(user)

    if(req.cookies){
        res.render('main',{
            layout:'./layouts/main',
            user:user
        })
    }else{
        res.render('main',{
            layout:'./layouts/main',
            user:user
        
        })
    }

});

router.post('/', (req:Request, res:Response) => {

    console.log("posted in main ...")

    console.log(req.body)

});

export default router