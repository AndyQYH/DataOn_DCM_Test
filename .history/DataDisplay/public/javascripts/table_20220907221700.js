let data_global = {}
let protocol = 'http'
let source = "device-actions"
var user = location.href.split('/').slice(-1)[0]
let url =`/users/${user}/` + source
let msg = ""
console.log(url)

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
   if(location.href.split('/').slice(-1)[0] != 'guest'){
      $('.button.dark.outline').attr('disabled',false);
   }
   $('.button.success').css('disabled',true)   
   console.log("inside ready function ...")
   msg = sessionStorage.getItem('msg')
   console.log("value of msg:")
   console.log(msg)
   if(msg === 'success' || msg === 'error-server'){
      createMsg(msg)
      createMsgEvent()
      createMsgFade(4500)
      sessionStorage.setItem('msg','')
      msg = ''
   }
   getSessions()
});

function createMsg(type, timeout = 0, msg=''){
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
      if(msg !=''){
         info_msg = `<div class="alert warning" id="yellow-msg" >
                        <span class="closebtn num">&times;</span>
                        <div class="info-box-content">
                           <h3>${msg}</h3>
                        </div>
                  </div>`
      }else{
         info_msg = `<div class="alert warning" id="yellow-msg" >
                        <span class="closebtn">&times;</span>
                        <div class="info-box-content">
                           <h3>The Request Have Not Yet Received A Response ...</h3>
                           <p>Waiting for result ...</p>
                        </div>
                  </div>`
      }
      
      
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
   await new Promise(resolve =>setTimeout(resolve,500))

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
   console.log($('.form-session').css('opacity'))
   
   
   if($('.form-session.create').css('opacity') == '0'){

      console.log($('.invalid_feedback'))
      console.log($('.invalid_feedback').css('display'))
      $('.form-session.create').css('opacity','1')
      $('.form-session.create').css('width','calc(50% + 165px)')
      $('.form-session.create').css('height','auto')
      $('.form-session.create').css('left','0%')
      $('.button.success').disabled = true
      
   }else if($('.form-session.create').css('opacity') == '1'){
      
      const inputs = $('.form-input')
      console.log(inputs)
      for(var i = 0; i < inputs.length; i++){
         inputs[i].value=''
      }
      
      console.log($('.invalid_feedback').css('display'))
      $('.form-session.create')[0].reset()
      $('.form-session.create').css('opacity','0')
      $('.form-session.create').css('width','0px')
      $('.form-session.create').css('height','0px')
      $('.form-session.create').css('left','100%')
      
   }
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

   $('button').attr('disabled',true)

   return data_global
}

function bootPXE()
{
   let items = getItems()
   let bootSelect = document.querySelector("select")
   let selected = bootSelect.options[bootSelect.selectedIndex].text
   if(items['status'].length <= 0){
      createMsg('warn',0,'No items are selected. Try again.')
      createMsgEvent()
      createMsgFade(10000)
      $('button').attr('disabled',false)
      return
   }

   for(var i = 0; i < items['status'].length; i++){
      items['status'][i].push(selected)
   }

   items['action']=['boot']

   console.log(items)

   if(getCredentials(items)  == "try again"){
      $('button').attr('disabled',false)
      return
   }
   
   let response = doRESTRequest(items,url,'POST');

   if(msg  !== 'error' && msg != '')
   {
      createMsg('warn', 10000)
      createMsgEvent()
      location.reload()
   }
   
}

function changeLED()
{
   items = getItems()
   if(items['status'].length <= 0){
   
      createMsg('warn',0,'No items are selected. Try again.')
      createMsgEvent()
      createMsgFade(5000)
      $('button').attr('disabled',false)
      return
   }

   items['action']=['LED']
   console.log(items)

   if(getCredentials(items)  == "try again"){
      $('button').attr('disabled',false)
      return
   }
   let response = doRESTRequest(items,url,'POST')
   if(msg  !== 'error' && msg != '')
   {
      createMsg('warn',10000)
      createMsgEvent()
      location.reload()
   }
   
}

function reloadPage()
{
   items = getItems()
   createMsg('info')
   createMsgEvent()
   createMsgFade(4500)
   
   location.reload()
}

function changePower(option)
{
   items = getItems()
   if(items['status'].length <= 0){
      createMsg('warn',0,'No items are selected. Try again.')
      createMsgEvent()
      createMsgFade(10000)
      $('button').attr('disabled',false)
      return
   }

   items['action']=['power',option]
   console.log(items)
   
   if(getCredentials(items)  == "try again"){
      $('button').attr('disabled',false)
      return
   }
   let response = doRESTRequest(items,url,'POST')
   if(msg  !== 'error' && msg != '')
   {
      createMsg('warn', 10000)
      createMsgEvent()
      location.reload()
   }
   
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
         msg = 'warn'
         var info = 'Credentials log-in is needed for this action. Please add a new web session!'
         createMsg(msg,0,info)
         createMsgEvent()
         addNewSession()
         return "try again"
      
      }else if(getSessions()[0] == "guest user" && getSessions()[1] > 1){
         msg = 'warn'
         var info = 'This action requires credentials log-ins. Please try another option for web sessions...'
         createMsg(msg,0,info)
         createMsgEvent()

         return "try again"
      }else{
         //alert('Using web session with credentials ' + getSessions()[0])
         credentials.push(getSessions()[0])
         payLoad['credentials'] = credentials
      }
   }
}

function doRESTRequest(payLoad, url, method) {
   createMsg('info')
   createMsgEvent()
   createMsgFade(4500)

   $('button').css('disabled',true)

   msg=''
   console.log(payLoad)
   let http = new XMLHttpRequest()

   isAsync = false
   http.open(method,url, isAsync)
   http.setRequestHeader("Content-type", "application/json")

   http.onreadystatechange = function(){
      if(http.readyState==4 && http.status==200){
         //alert(http.responseText)
         if(http.responseText == "Completed")
         {
            msg = "success"
         }else if(http.responseText == "Failed Database"){
            msg = "error-server" 
         }
            
      }else if(http.responseText == "Session Timeout" && http.status == 401){
         msg = ''
         $('.form-session.time-out').css('opacity','1')
         $('.form-session.time-out').css('width','calc(50% + 165px)')
         $('.form-session.time-out').css('height','auto')
         $('.form-session.time-out').css('left','0%')
         $('.form-session.time-out').disabled = true
         $('.form-session.time-out input')[0].value = payLoad['credentials'][0].split(":")[0]
         
         var text = `<div class="alert warning" id="yellow-msg">
                                    <span class="closebtn" >&times;</span>
                                    <div class="info-box-content">
                                        <h3>${http.responseText}!</h3>
                                    </div>
                     </div>`
         $('.form-session.time-out').prepend(text)
         createMsgEvent()

         $('button').attr('disabled',false)
            
      }else{
         msg = "error"
      }
            
         sessionStorage.setItem("msg", msg)
   }
   

   http.send(JSON.stringify(payLoad))
   
   
}
   



