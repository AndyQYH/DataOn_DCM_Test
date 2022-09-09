var sessionAuth = async (req:any, res:any, next:any) => {
    var session = req.body.credentials[0].split(':')[0]
    console.log(req.cookies)

    if(req.cookies.session){
        next()
    }else{
        return res.status(401).send('Session time out ... Please provide the password for the session')
    }

}