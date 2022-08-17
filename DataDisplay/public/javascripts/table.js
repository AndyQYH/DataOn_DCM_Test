let data_global = {}
let protocol = 'http'
let host = 'localhost'
let port = 3000
let source = "bootdevices"
let url ="/" + source
let msg = ""
sessionStorage.setItem("sessionNames",'')
sessionStorage.setItem("sessionPwds",'')
sessionStorage.setItem("count",0)

const button_selected =  document.querySelector('#btn-add-session')
const button_PXEboot = document.querySelector('#btn-boot-pxe')
const button_refresh = document.querySelector('#btn-ref')
const button_led = document.querySelector('#btn-led')
const button_restart = document.querySelector('#btn-restart')
const button_off= document.querySelector('#btn-power-off')
const button_on = document.querySelector('#btn-power-on')
const web_select = document.querySelector('select')
button_selected.addEventListener('click', addNewSession)
button_PXEboot.addEventListener('click', function(){
                                 bootPXE();
                              })
button_refresh.addEventListener('click', function(){
                                 reloadPage();
                                 
                               })
button_led.addEventListener('click', function(){
                             changeLED();
                             
                           })
button_restart.addEventListener('click', function(){
                                          changePower("ForceRestart");
                               })
button_off.addEventListener('click', function(){
                                       changePower("ForceOff");
                           })
button_on.addEventListener('click', function(){
                                       changePower("On");
                          })

web_select.addEventListener('change', function(){
                                       getSessions()
                           })

$(document).ready(function(){
   console.log($('nav button'))
   $('nav button').attr('disabled',false);
   console.log("inside ready function ...")
   msg = sessionStorage.getItem('msg')
   console.log("value of msg:")
   console.log(msg)
   if(msg === 'success' || msg === 'error' || msg === 'error-server'){
      createMsg(msg)
      createMsgEvent()
      createMsgFade(4500)
      sessionStorage.setItem('msg','')
   }
   getSessions()
});

function createMsg(type, timeout = 0){
   let msg_menu = document.getElementById('msg-menu')
   var info_msg
   if(type == 'info')
   {
      info_msg = `<div class="alert info" id="info-msg">
                     <span class="closebtn" >&times;</span>
                     <div class="info-box-content">
                        <h3>Request Received! Processing ...</h3>
                        <p>Please wait while we make update to the system ...</p>
                     </div>
                  </div>`
   }else if(type == 'success'){
      info_msg = `<div class="alert success" id="green-msg">
                           <span class="closebtn" >&times;</span>
                           <div class="info-box-content">
                              <h3>Request Completed!</h3>
                              <p>Check the table for updates!</p>
                           </div>
                     </div>`
   }else if(type == 'warn'){
      info_msg = `<div class="alert warning" id="yellow-msg" >
                        <span class="closebtn">&times;</span>
                        <div class="info-box-content">
                           <h3>The Request Have Not Yet Received A Response ...</h3>
                           <p>Waiting for result ...</p>
                        </div>
                  </div>`
   }else if(type == 'error-server'){
      info_msg = `<div class="alert" >
                     <span class="closebtn">&times;</span>
                     <div class="info-box-content">
                        <h3>OOPS! Something Went Wrong For The Request On the Server Side...</h3>
                        <p>Please check if the server has been started ...</p>
                     </div>
                  </div>`
   }else{
      info_msg = `<div class="alert" >
                     <span class="closebtn">&times;</span>
                     <div class="info-box-content">
                        <h3>OOPS! Something Went Wrong For The Request On the Database Side...</h3>
                        <p>Please Try again later ...</p>
                     </div>
                  </div>`
   }

   if(timeout > 0){
      setTimeout(function(){
         msg_menu.innerHTML += info_msg
      },timeout)
   }else{
      msg_menu.innerHTML += info_msg
   }
}

async function createMsgFade(ms){
   var close
   await new Promise(resolve =>setTimeout(resolve,1000))

   close = document.getElementsByClassName('closebtn')
   
   for(var i = 0; i < close.length; i++){
      
      let div = close[i].parentElement
      
      setTimeout(function(){
         div.style.opacity = "0"
      }, ms)

      setTimeout(function(){
         div.style.display = "none"
      }, ms+500)
   }
}

function createMsgEvent(){
   let close = document.getElementsByClassName('closebtn')

   while(close == undefined || close == null){
      close = document.getElementsByClassName('closebtn') 
      console.log("close = " + close)
   }

   for(var i = 0; i < close.length; i++){
      close[i].onclick = function(){
            let div = this.parentElement
            div.style.opacity = "0"
            setTimeout(function(){
               div.style.display = "none"
            }, 500)
      }
   }
}

function addNewSession()
{
   console.log($('.form-session'))
   btn_session = document.querySelector('.form-session')
   btn_session.style.display = "block"
   btn_session.style.opacity = "1"
}

function getItems(){
   let addresses = [] 
   var table = $('#table-main').data('table');
   data = table.getSelectedItems()
   
   data.forEach((row)=>{
      //console.log(typeof row)
      let ip = row[1].replace(/<\/?[^>]+(>|$)/g, "").replace(/\s/g, "")
      let power = row[2].replace(/<\/?[^>]+(>|$)/g, "").replace(/\s/g, "")
      let serial = row[4]
      let control = row[5].replace(/<\/?[^>]+(>|$)/g, "").replace(/\s/g, "")
      let temp = [ip, serial, power, control]
      addresses.push(temp)
   })

   data_global = {
      "status":addresses
   }

   $('ul button').attr('disabled',true)

   return data_global
}

function bootPXE()
{
   let items = getItems()
   if(items['status'].length <= 0){
      alert('no items are selected. Try again.')
      $('ul button').attr('disabled',false)
      return
   }

   for(var i = 0; i < items['status'].length; i++){
      items['status'][i].push('Pxe')
   }

   items['action']=['bootPXE']

   console.log(items)

   if(getCredentials(items)  == "try again"){
      return
   }
   
   let response = doRESTRequest(items,url,'POST');

   if(msg  !== 'error')
   {
      createMsg('info', 10000)
      createMsgEvent()
   }
   count = sessionStorage.getItem('count')
   count++
   sessionStorage.setItem('count',count)
   location.href = 'http://localhost:3000'
}

function changeLED()
{
   items = getItems()
   if(items['status'].length <= 0){
      alert('no items are selected. Try again.')
      $('ul button').attr('disabled',false)
      return
   }

   items['action']=['LED']
   console.log(items)

   if(getCredentials(items)  == "try again"){
      return
   }
   let response = doRESTRequest(items,url,'POST')
   if(msg  !== 'error')
   {
      createMsg('info',10000)
      createMsgEvent()
   }
   count = sessionStorage.getItem('count')
   count++
   sessionStorage.setItem('count',count)
   location.href = 'http://localhost:3000'
}

function reloadPage()
{
   items = getItems()
   createMsg('info')
   createMsgEvent()
   createMsgFade(4500)
   
   count = sessionStorage.getItem('count')
   count++
   sessionStorage.setItem('count',count)
   location.href = 'http://localhost:3000'
}

function changePower(option)
{
   items = getItems()
   if(items['status'].length <= 0){
      alert('no items are selected. Try again.')
      $('ul button').attr('disabled',false)
      return
   }

   items['action']=['power',option]
   console.log(items)
   
   if(getCredentials(items)  == "try again"){
      return
   }
   let response = doRESTRequest(items,url,'POST')
   if(msg  !== 'error')
   {
      createMsg('warn', 10000)
      createMsgEvent()
   }
   count = sessionStorage.getItem('count')
   count++
   sessionStorage.setItem('count',count)
   location.href = 'http://localhost:3000'
}

function getSessions(){
   usernames = []
   let sessionSelect = document.querySelector("select")
   let selected = sessionSelect.options[sessionSelect.selectedIndex].text
   let options = sessionSelect.options
   console.log(options)
    
   for(var i =0; i < options.length; i++){
      usernames.push(options[i].text)
   }

   sessionStorage.setItem('sessionNames',JSON.stringify(usernames))
   console.log([selected, options.length])
   return [selected,options.length]
}

function getCredentials(payLoad){
   if(payLoad['status'].length > 0){
      let credentials = []
      if(getSessions()[0] == "guest user" && getSessions()[1] <= 1){
         let username = prompt("Credentials are needed for this action. Please enter the username");
         while(username === ''){
            username = prompt("Please enter the username (can not be empty)")
         }

         while(sessionStorage.getItem('sessionNames').includes(username)){
            username = prompt("Username already in use! Try again ...")
         }

         if(username !== null){
            credentials.push(username)
         }else{
            $('ul button').attr('disabled',false);
            return
         }
   
         let password = prompt("Please enter the password");
         while(password === ''){
            password = prompt("Please enter the password (can not be empty)")
         }
   
         if(password !== null){
            credentials.push(password)
         }else{
            $('ul button').attr('disabled',false);
            return
         }
         
         if(credentials.length == 2){
            let usernames = JSON.parse(sessionStorage.getItem('sessionNames'))
            
            usernames.push(username)
         
            usernames = usernames.filter(function(el){
               return el != null && el != undefined && el != ''
            })

            sessionStorage.setItem('sessionNames', JSON.stringify(usernames))
         }


         payLoad['credentials'] = credentials
      }else if(getSessions()[0] == "guest user" && getSessions()[1] > 1){
         alert('This action requires credentials log-ins. Please try another option for web sessions...')
         return "try again"
      }else{
         alert('Using web session with credentials ' + getSessions()[0])
         credentials.push(getSessions()[0])
         payLoad['credentials'] = credentials
      }
   }
}

function doRESTRequest(payLoad, url, method) {
   createMsg('info')
   createMsgEvent()
   createMsgFade(4500)

   msg=''
   console.log(payLoad)
   let http = new XMLHttpRequest()

   isAsync = false
   http.open(method,url, isAsync)
   http.setRequestHeader("Content-type", "application/json")

   http.onreadystatechange = function(){
      if(http.readyState==4 && http.status==200){
         alert(http.responseText)
         if(http.responseText == "Completed")
         {
            msg = "success"
         }else if(http.responseText == "Failed Database"){
            msg = "error" 
         }else{
            msg = "error-server"
         }
            
         sessionStorage.setItem("msg", msg)
      }
   }
   let sessions = JSON.parse(sessionStorage.getItem("sessionNames"))


   payLoad['sessions'] = sessions
   http.send(JSON.stringify(payLoad))
   //$('ul button').attr('disabled',false)
   
}
   





