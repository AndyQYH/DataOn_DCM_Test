"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const dotenv_1 = __importDefault(require("dotenv"));
const axios_1 = __importDefault(require("axios"));
const fs_1 = __importDefault(require("fs"));
const csv_parse_1 = require("csv-parse");
const https_1 = __importDefault(require("https"));
dotenv_1.default.config();
//variables declarations
//----------------------------------------------------------------------------------------------------------
let devices = [];
let addresses_selected = {};
let addresses_global = [];
let sessions = [];
const labels = ['Node', 'BMC IP address', 'Status', 'Model', 'Serial Number', 'Indicator LED', 'CPU', 'Memory', 'IO', 'Power'];
const target = ['10.4.7.43', '10.4.7.79'];
const csv = "DCM_Data.csv";
const path = process.env.PATH_CSV;
const username_dcm = process.env.USRNAME_DCM;
const password_dcm = process.env.PASSWORD_DCM;
const username_redfish = process.env.USRNAME_REDFISH;
const password_redfish = process.env.PASSWORD_REDFISH;
const credentials_dcm = Buffer.from(username_dcm + ":" + password_dcm).toString('base64');
const credentials_redfish = Buffer.from(username_redfish + ":" + password_redfish).toString('base64');
var basicAuth_dcm = 'Basic ' + credentials_dcm;
var basicAuth_redfish = 'Basic ' + credentials_redfish;
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
console.log(basicAuth_dcm);
console.log(basicAuth_redfish);
const url_dcm = process.env.URL_DCM_HOST + ":" + process.env.URL_DCM_PORT + process.env.URL_DCM_SOURCE;
//--------------------------------------------------------------------------------------------------------------------------------
//Router Functions
//--------------------------------------------------------------------------------------------------------------------------------
const router = express_1.default.Router();
router.use(body_parser_1.default.json());
router.get('/', async (req, res) => {
    console.log("inside get");
    addresses_global = [];
    let readData = [];
    let endpoints = [];
    const agent = new https_1.default.Agent({
        rejectUnauthorized: false
    });
    //First getting all available devices from the DCM, specifically IP addresses and name
    //retry if having trouble making connection until success
    //return on timeout
    var error = true;
    while (error) {
        console.log("Trying request to DCM ...");
        await getConnectionDCM(url_dcm, agent, basicAuth_dcm, readData, addresses_global, ['name', 'address', 'powerStatus', 'model', 'serialNumber'])
            .then((response) => {
            error = response;
        });
        console.log(error);
    }
    console.log("after DCM request");
    console.log("combining data with Redfish Schema ...");
    console.log("fetching device status, metrics ...");
    //console.log(readData)
    //format IP addresses into usable links for Redfish API
    //Redfish format: https://$host/redfish/v1/Systems
    addresses_global.forEach((address) => {
        if (target.includes(address)) {
            let temp = process.env.URL_REDFISH_HOST + "://" + address + process.env.URL_REDFISH_SOURCE;
            endpoints.push(temp);
        }
    });
    //Naviagate to /Systems page to retrieve serial number for further access to detailed info.
    error = true;
    while (error) {
        console.log("trying to connect to Redfish ...");
        await getConnectionRedFish(endpoints, agent, basicAuth_redfish).then((resp) => {
            if (resp) {
                error = false;
                endpoints = resp;
            }
        });
        console.log(error);
    }
    //console.log(endpoints)
    //Get Info like power status, model, serial from the /systems/$serialnumber page
    //retry if having trouble making connection until success
    //return on timeout
    error = true;
    while (error) {
        console.log("trying connection to Redfish ...");
        await getBasicRedFish(endpoints, agent, basicAuth_redfish, ['PowerState', 'Model', 'SerialNumber', 'IndicatorLED',])
            .then((resp) => {
            if (resp) {
                error = false;
                let count = 0;
                for (var i = 0; i < readData.length; i++) {
                    if (target.includes(readData[i]['address'])) {
                        console.log("inside if");
                        let temp = {
                            ...readData[i],
                            ...resp[count++]
                        };
                        readData[i] = temp;
                        delete readData[i]['powerStatus'];
                        delete readData[i]['model'];
                        delete readData[i]['serialNumber'];
                    }
                    else {
                        let temp = {
                            ...readData[i],
                            ...{ 'IndicatorLED': '' }
                        };
                        readData[i] = temp;
                    }
                }
            }
        });
        console.log(error);
    }
    //Getting the metrics evaluation from the /Systems/$serialnumber/Metrics page
    //Redfish format: https://$host/redfish/vs/Systems/Metrics
    for (var j = 0; j < endpoints.length; j++) {
        endpoints[j] = endpoints[j] + "/Metrics";
    }
    //retry if having trouble making connection until success
    //return on timeout
    error = true;
    while (error) {
        console.log("trying connection to Redfish ...");
        await getBasicRedFish(endpoints, agent, basicAuth_redfish, ['ProcessorBandwidthPercent', 'MemoryBandwidthPercent', 'IOBandwidthGBps']).then((resp) => {
            if (resp) {
                error = false;
                let count = 0;
                for (var i = 0; i < readData.length; i++) {
                    if (target.includes(readData[i]['address'])) {
                        console.log("inside if");
                        let temp = {
                            ...readData[i],
                            ...{ 'ProcessorBandwidthPercent': resp[count]['ProcessorBandwidthPercent'] + "%",
                                'MemoryBandwidthPercent': resp[count]['MemoryBandwidthPercent'] + "%",
                                'IOBandwidthGBps': resp[count]['IOBandwidthGBps'] + "GBps"
                            }
                        };
                        readData[i] = temp;
                        count++;
                    }
                    else {
                        let temp = {
                            ...readData[i],
                            ...{ 'ProcessorBandwidthPercent': '', 'MemoryBandwidthPercent': '', 'IOBandwidthGBps': '' }
                        };
                        readData[i] = temp;
                    }
                }
            }
        });
        console.log(error);
    }
    //Finally, getting the Power Consumption
    const regex = new RegExp('Systems\/.*$');
    for (var j = 0; j < endpoints.length; j++) {
        endpoints[j] = endpoints[j].replace(regex, 'Chassis/RackMount/Baseboard/Power');
    }
    error = true;
    while (error) {
        console.log("trying connection to Redfish ...");
        await getBasicRedFish(endpoints, agent, basicAuth_redfish, ['PowerControl']).then((resp) => {
            if (resp) {
                error = false;
                let count = 0;
                for (var i = 0; i < readData.length; i++) {
                    if (target.includes(readData[i]['address'])) {
                        console.log("inside if");
                        let temp = {
                            ...readData[i],
                            ...{ "PowerConsumedWatts": resp[count++]['PowerControl'][0]['PowerConsumedWatts'] + "W" }
                        };
                        readData[i] = temp;
                    }
                    else {
                        let temp = {
                            ...readData[i],
                            ...{ "PowerConsumedWatts": '' }
                        };
                        readData[i] = temp;
                    }
                }
            }
        });
        console.log(error);
    }
    //console.log(readData)
    devices = readData;
    //console.log(devices)
    if (devices.length > 0) {
        res.render('index', {
            labels: labels,
            devices: devices,
            sessions: sessions
        });
    }
    else {
        console.log("can not get web response, loading from local database instead ...");
        console.log("current data might be outdated, try refreshing for updates...");
        readFromCsv(path + csv, res, labels, devices);
    }
});
//router to handle post requests on / page
router.post('/', (req, res) => {
    let host = req.headers.host;
    console.log("inside post");
    console.log(host);
    if (host == "localhost:3000") {
    }
    /*
    stringify(req_data,{header:true, columns:labels},function(err, output){
        fs.writeFile(path+csv,output,"utf8", (err) => {
            if (err)
              console.log(err);
            else
              console.log("File written successfully\n");
              console.log("The written has the following contents:");
              //console.log(fs.readFileSync(path+csv, "utf8"));
            })
    })
    */
    res.send("received data");
});
router.get('/bootdevices', (req, res) => {
    let temp = addresses_selected;
    res.send(temp);
});
router.post('/bootdevices', async (req, res) => {
    var resp;
    let req_data = req.body;
    addresses_selected = req_data;
    console.log(req_data);
    console.log("posted");
    console.log(req_data['session']);
    sessions.push(req_data['sessions']);
    const agent = new https_1.default.Agent({
        rejectUnauthorized: false
    });
    await axios_1.default.post("http://localhost:5000", req_data, {
        httpsAgent: agent,
        headers: { "Authorization": basicAuth_redfish }
    })
        .then((response) => {
        resp = response.data;
        console.log(resp);
        if (resp == undefined || resp == null) {
            resp = "error-server";
        }
    }).catch((err) => {
        console.log(err);
    });
    res.send(resp);
});
//--------------------------------------------------------------------------------------------------------------------
//Utility Functions
//--------------------------------------------------------------------------------------------------------------------
function readFromCsv(path, res, labels, devices) {
    fs_1.default.createReadStream(path)
        .pipe((0, csv_parse_1.parse)({ delimiter: ",", from_line: 2 }))
        .on("data", function (row) {
        let temp = {};
        //console.log(row);
        for (let i = 0; i < row.length; i++) {
            temp[labels[i]] = row[i];
        }
        devices.push(temp);
    })
        .on("end", function () {
        //console.log('devices')
        //console.log(devices)
        res.render('index', {
            labels: labels,
            devices: devices,
            sessions: sessions
        });
        console.log("finished rendering");
    })
        .on("error", function (error) {
        console.log(error.message);
    });
}
async function getConnectionRedFish(urls, agent, basicAuth) {
    return Promise.allSettled(urls.map((url) => axios_1.default.get(url, {
        httpsAgent: agent,
        headers: { "Authorization": basicAuth }
    }))).then((response) => {
        if (response) {
            let newEndPoints = [];
            response.forEach((device) => {
                let host = device['value']['request'].host;
                let temp = process.env.URL_REDFISH_HOST + "://" + host + device['value']['data']['Members'][0]['@odata.id'];
                newEndPoints.push(temp);
            });
            return newEndPoints;
        }
    }).catch((err) => {
        console.log(err);
    });
}
async function getBasicRedFish(urls, agent, basicAuth, labels) {
    return Promise.allSettled(urls.map((url) => axios_1.default.get(url, {
        httpsAgent: agent,
        headers: { "Authorization": basicAuth }
    }))).then((response) => {
        let temps = [];
        response.forEach((device) => {
            let temp = {};
            labels.forEach((label) => {
                temp[label] = device['value']['data'][label];
            });
            temps.push(temp);
        });
        return temps;
    }).catch((err) => {
        console.log(err);
    });
}
async function getBasicRedFishAxios(urls, agent, basicAuth, labels) {
    return axios_1.default.all(urls.map((url) => axios_1.default.get(url, {
        httpsAgent: agent,
        headers: { "Authorization": basicAuth_redfish }
    }))).then((response) => {
        let temps = [];
        response.forEach((device) => {
            let temp = {};
            labels.forEach((label) => {
                temp[label] = device['data'][label];
            });
            temps.push(temp);
        });
        return temps;
    }).catch((err) => {
        console.log(err);
    });
}
async function getConnectionDCM(url, agent, basicAuth, readData, addresses, labels) {
    return axios_1.default.get(url, {
        httpsAgent: agent,
        headers: { "Authorization": basicAuth }
    }).then(function (response) {
        let response_data = response.data['content'];
        let temp;
        response_data.forEach((device) => {
            temp = {};
            labels.forEach((label) => {
                temp[label] = device[label];
            });
            readData.push(temp);
            addresses.push(temp['address']);
        });
        return false;
    }).catch(function (error) {
        console.log("error:");
        console.log(error.toJSON());
    });
}
exports.default = router;
