
console.log('using users.js ...')


$(document).ready(function(){
    console.log("inside ready function ...")
 });

$('.user.login-form').submit(function(e){
    console.log('submitted to login')
    e.preventDefault();
    let data = new FormData(e.target)
    let data_json = {}
    data_json = Object.fromEntries(data.entries())
    console.log(typeof data_json)
    console.log(data_json)
    $('.user.login-form')[0].css('disabled',true)
    $.ajax({
        url: '/log-in',
        type: 'post',
        data: data_json,
        success:function(response){
            console.log(response)
            //alert("The server says: " + response.msg)
           
            createMsgEvent()
            //await new Promise(resolve =>setTimeout(resolve,1000))
            $('.user.login-form').prepend(`<div class="alert success" id="green-msg">
                                                <span class="closebtn" >&times;</span>
                                                <div class="info-box-content">
                                                    <h3>${response.msg}!</h3>
                                                </div>
                                            </div>`)
            createMsgEvent()
            $('.button.success').css('disabled',true)

            setTimeout(function(){
                location.assign(`/users/${response.user}`)
            },1000)
            
        },
        error:function(resp){
            console.log(resp)
            //alert("The server says: " + resp.responseText)
            $('.user.login-form').prepend(`<div class="alert">
                                                    <span class="closebtn" >&times;</span>
                                                    <div class="info-box-content">
                                                        <h5>${resp.responseText}!</h5>
                                                    </div>
                                                </div>`)
            createMsgEvent()
        }
    })
    
})

$('.user.register-form').submit(function(e){
    e.preventDefault();
    let device = window.navigator.userAgent
    let date = new Date(Date.now()).toString()
    let data = new FormData(e.target)
    console.log(data)
    let data_json = {}
    data_json = Object.fromEntries(data.entries())
    data_json = {...data_json, ...{'device':device,'date':date}}
    data_json = JSON.parse(JSON.stringify(data_json))
    console.log(typeof data_json)
    console.log(data_json)
    $('.user.register-form')[0].css('disabled',true)
    $.ajax({
        url: '/log-in/register',
        type: 'post',
        data: data_json,
        success:function(response){
            console.log(response)
            //alert("The server says: " + response)
           
            $('.status.register').css('display','block')
            $('.alert.success').css('display','block')
            $('.alert.success').css('opacity','1')
            $('.user.register-form .form-group').css('display','none')
            createMsgEvent()
            
        },
        error:function(resp){
            console.log(resp)
            //alert("The server says: " + resp.responseText)
            $('.user.register-form').prepend(`<div class="alert">
                                                    <span class="closebtn" >&times;</span>
                                                    <div class="info-box-content">
                                                        <h5>${resp.responseText}!</h5>
                                                    </div>
                                                </div>`)
            createMsgEvent()
        }
    })
    
})


$('.button.show').click(function(e){
    console.log('show clicked')
    $('.button.show').css('display','none')
    document.querySelector('#password1').type = 'text'
    $('.button.hide').css('display','block')
})

$('.button.hide').click(function(e){
    console.log('hide clicked')
    $('.button.hide').css('display','none')
    document.querySelector('#password1').type = 'password'
    $('.button.show').css('display','block')
    
})


function myValidatePassword(val){
    //console.log(val)
    var password1
    password1 = $('#password1')[0].value
    console.log(password1)
    if(password1 != ''){
        if(val == password1){
            $('.button.success').attr('disabled',false)
            return true
        }else{
            $('.button.success').attr('disabled',true)
            return false
        }
    }
    
    return false
    
}

function myValidatePassword2(val){
    //console.log(val)
    var password2
    if($('#password2')[0].value != ''){
        password2 = $('#password2')[0].value
        console.log(password2)

        if(val == password2){
            $('.button.success').attr('disabled',false)
            return true
        }else{
            $('.button.success').attr('disabled',true)
            return false
        }
    }

    return false
    
}

    
    
