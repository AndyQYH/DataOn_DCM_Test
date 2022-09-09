import {schema, db_users} from '../models/db'

var sessionAuth = async (req:any, res:any, next:any) => {
    console.log('doing session authentication ...')
    var [username_redfish, ...date] = req.body.credentials[0].split(':')
    date = date.join(':').replace(' ', '')
    console.log(username_redfish)
    console.log(date)
    const decode:any = await db_users.get('SELECT * FROM sessions WHERE user = ? AND username = ? AND date = ?',[req.params.id,username_redfish,date])
    var password_redfish = decode.password
   
    console.log(req.cookies)

    if(req.params.id == 'guest'){
        next()
    }else{
        if(req.cookies.user){
            console.log('session in use ...')
            if(req.cookies[req.cookies.user] == req.cookies.user+":"+date){
                next()
            }
            else{
                console.log('not the right user ...')
                return res.status(401).send('not authorized')
            }
        }else{
            console.log('session not in use ...')
            return res.status(401).send('Session Timeout')
        }
    }

}

export{sessionAuth}