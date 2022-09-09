import express, {Express, Request, Response} from 'express'
import dotenv from 'dotenv'
import expressLayouts from 'express-ejs-layouts'
import bodyParser from 'body-parser'
import methodOverride from 'method-override'
import sqliteDB from './models/db'
import mainRouter from './routes/main'
import indexRouter from './routes/index'
import userRouter from './routes/users'


if (process.env.NODE_ENV !== 'production') {
    dotenv.config()
}


const app: Express = express()
const PORT:number|undefined = parseInt(process.env.PORT as string);
const HOST:string = process.env.SERVER as string
console.log("port: " + PORT)

app.set('view engine', 'ejs')
app.set('views',__dirname+'/views')
app.set('layout', 'layouts/layout')
app.use(expressLayouts)
app.use(methodOverride('_method'))
app.use('/', mainRouter)
app.use('/users',indexRouter)
app.use('/log-in',userRouter)
//app.use('/sessions',sessionRouter)
app.use(express.static('public'))
app.use(express.static('node_modules'))
app.use(bodyParser.urlencoded({ extended: true }))

app.listen(PORT, ()=>{
    console.log(`[server]: Server is running at http://localhost:${PORT}`)
})
