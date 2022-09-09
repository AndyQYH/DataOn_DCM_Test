
var sessionAuth = async (req:any, res:any, next:any) => {
    console.log('doing session authentication ...')
    var [username_redfish, ...date] = req.body.credentials[0].split(':')
    date = date.join(':').replace(' ', '')
    console.log(username_redfish)
    console.log(date)
   
    console.log(req.cookies)
    if(res.status == 401){
        console.log('error already exists in userAuth ...')
        return next()
    }

    if(req.params.id == 'guest'){
        return next()
    }else{
        var key = username_redfish+":"+date
        console.log(key)
        if(req.cookies[key]){
            console.log('session in use ...')
            
            if(req.cookies[username_redfish+":"+date] == req.cookies.user){
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