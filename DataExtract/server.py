import requests
import urllib3
from requests.auth import HTTPBasicAuth
import certifi
from flask import Flask, redirect, url_for, request
import time
import json
import ssl

sessions = {}

def get_basic_auth_token(username,password):
        """Gets HTTP basic authentication header (string).

        :return: The token for basic HTTP authentication.
        """
        return urllib3.util.make_headers(
            basic_auth = username + ':' + password
        ).get('authorization')

def set_next_boot_onetime_boot_device(url,options,session):
    BootOptions = {"BootSourceOverrideEnabled":"Once","BootSourceOverrideTarget":options}
    Boot = {"Boot":BootOptions}
    print(Boot)
    print(type(Boot))
    return session.patch(url,data = json.dumps(Boot),verify = False)

def reboot_server(url,session):
    
    response = session.get(url,verify=False)
    if response.json()['PowerState'] =="On":
        url_post = url + "/Actions/ComputerSystem.Reset"
        payload = {'ResetType': 'ForceRestart'}
       
    else:
        url_post = url + "/Actions/ComputerSystem.Reset"
        payload = {'ResetType': 'On'}
        
    return session.post(url_post,data=json.dumps(payload),verify=False)

def set_power_control(url,options,session):

    control_payload = {'ResetType': options}
    print(control_payload)
    url_post = url + "/Actions/ComputerSystem.Reset"
    return session.post(url_post,data = json.dumps(control_payload),verify = False)

def set_indicator_LED(url,options,session):
    if options == 'Blinking':    
        LEDOptions = {'IndicatorLED': 'Off'}
    elif options == 'Off':    
        LEDOptions = {'IndicatorLED': 'Blinking'}
    print(json.dumps(LEDOptions))
   
    return session.patch(url,data = json.dumps(LEDOptions),verify = False)

def waitForResourceAvailable(response, timeout, timewait):
    timer = 0
    while response.status_code == 204:
        time.sleep(timewait)
        timer += timewait
        if timer > timeout:
            break
        if response.status_code == 200:
            break

print(certifi.where())


app = Flask(__name__)

@app.route('/',methods = ['POST', 'GET'])
def predict():
   if request.method == 'POST':

        print(request.json)
        username = request.json['credentials'][0]
        password = request.json['credentials'][1]
        b64str = get_basic_auth_token(username,password)
        
        auth = request.authorization
        auth = get_basic_auth_token(auth.username,auth.password)

        print("encode:",b64str)
        print("header auth:", auth)

        s = requests.Session()

        if(len(sessions) <= 0):
            print('no sessions, adding a new one...')
            
            s.headers.update({'Accept': 'application/json'})
            s.headers.update({'Authorization': auth})
            s.headers.update({'Keep-Alive': 'timeout=10s, max=100'})
            s.headers.update({'max-age': '60'})
            sessions[auth] = s

        else:

            for key,session in sessions.items():
                if auth == key:
                    print('using existing session ...')
                    s = session
                    if(s.headers['max-age'] == '0'):
                        print('session timed out or have not been created')
                        return 'session timed out or have not been created'
                    else:
                        break

            

        print('sessions')
        print(s)

        print('headers:')
        print(s.headers)

        print('cookies:')
        print(s.cookies)

        credentials = request.json['status']
        action = request.json['action'][0]
        print(credentials)
        print(action)

        for query in credentials:
            url = "https://"+query[0]+"/redfish/v1/Systems/"+query[1]
            if action == 'boot':
                print("inside boot")
                bootOption = query[-1]
                response = set_next_boot_onetime_boot_device(url,bootOption,s)
                waitForResourceAvailable(response,1000,10)
                print(f'Status Code: {response.status_code}, Content: {response.json()}')
                if(response.status_code != 200):
                    return "Failed Database" 

                response = reboot_server(url,s)
                waitForResourceAvailable(response,1000,10)
                print(f'Status Code: {response.status_code}, Content: {response.json()}')
                if(response.status_code != 200):
                    return "Failed Database"
            elif action == 'power':
                print("inside power")
                option = request.json['action'][1]
                print(option)
                response = set_power_control(url,option,s)
                waitForResourceAvailable(response,1000,10)
                print(f'Status Code: {response.status_code}, Content: {response.json()}')
                if(response.status_code != 200):
                    return "Failed Database"
            elif action == 'LED':
                print("inside LED")
                option = query[3]
                response = set_indicator_LED(url,option,s)
                waitForResourceAvailable(response,1000,10)
                print(f'Status Code: {response.status_code}, Content: {response.json()}')
                if(response.status_code != 200):
                    return "Failed Database"
        
        return "Completed"

        # /request = requests.post(url = url_POST) 
   else:
      print("GET!")
      return "GET!"

if __name__ == '__main__':
   app.run(debug = True, port=5000)



