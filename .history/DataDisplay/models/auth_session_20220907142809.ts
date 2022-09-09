import {schema, db_users} from '../models/db'

var sessionAuth = async (req:any, res:any, next:any) => {
    var [username_redfish, ...date] = req.body.credentials[0].split(':')
      date = date.join(':')
      console.log(username_redfish)
      console.log(date)
      const decode:any = await db_users.get('SELECT * FROM sessions WHERE user = ? AND username = ? AND date = ?',[req.params.id,username_redfish,date])
      var password_redfish = decode.password
      console.log('password_redfish')
      console.log(password_redfish)

      var credentials_redfish = Buffer.from(username_redfish + ":"+ password_redfish).toString('base64')

      var basicAuth_redfish = 'Basic ' + credentials_redfish;
    console.log(req.cookies)

    if(req.cookies[basicAuth_redfish]){
        console.log('session in use ...')
        if(req.cookies[basicAuth_redfish] == req.params.id){
            next()
        }
        else{
            return res.status(401).send('not authorized')
        }
    }else{
        console.log('session not in use ...')
        return res.status(401).send('session timeout')
    }

}