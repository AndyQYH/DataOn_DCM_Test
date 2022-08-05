import requests
import urllib3
from requests.auth import HTTPBasicAuth
import certifi
import ssl
from flask import Flask, redirect, url_for, request
import asyncio
import os 
import json

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

username = "admin"
password = "admin1"
b64str = get_basic_auth_token(username,password)

print("encode:",b64str)
print(certifi.where())
print(ssl.OPENSSL_VERSION)

app = Flask(__name__)


@app.route('/',methods = ['POST', 'GET'])
def predict():
   if request.method == 'POST':

        credentials = request.json['credentials']
  
        source = "devices"
        
        url_POST = "http://localhost:3000"

        s = requests.Session()

        s.headers.update({'Accept': 'application/json'})

        s.headers.update({'Authorization': b64str})

        for query in credentials:
            url_PATCH = "https://"+query[0]+"/redfish/v1/Systems/"+query[1]
            response = set_next_boot_onetime_boot_device(url_PATCH,query[2],s)
            print(f'Status Code: {response.status_code}, Content: {response.json()}')
            response = reboot_server(url_PATCH,s)
            print(f'Status Code: {response.status_code}, Content: {response.json()}')
        
        return "Data Received"       

        # /request = requests.post(url = url_POST)
    
   else:
      print("GET!")
      return "GET!"

if __name__ == '__main__':
   app.run(debug = True, port=5000)



