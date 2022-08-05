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
let devices = [];
let addresses_selected = {};
let addresses_global = [];
const labels = ['Node', 'BMC IP address', 'Status', 'Model', 'Serial Number', 'CPU', 'Memory', 'IO', 'Power'];
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
console.log(basicAuth_dcm);
console.log(basicAuth_redfish);
const url_dcm = process.env.URL_DCM_HOST + ":" + process.env.URL_DCM_PORT + process.env.URL_DCM_SOURCE;
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
    await getConnectionDCM(url_dcm, agent, basicAuth_dcm, readData, addresses_global, ['name', 'address', 'powerStatus', 'model', 'serialNumber']);
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
    //console.log(endpoints)
    //console.log(typeof endpoints)
    //Naviagate to /Systems page to retrieve serial number for further access to detailed info.
    await getConnectionRedFish(endpoints, agent, basicAuth_redfish).then((resp) => {
        endpoints = resp;
    });
    //console.log(endpoints)
    //Get Info like power status, model, serial from the /systems/$serialnumber page
    await getBasicRedFish(endpoints, agent, basicAuth_redfish, ['PowerState', 'Model', 'SerialNumber']).then((resp) => {
        //console.log(resp)
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
        }
    });
    //Getting the metrics evaluation from the /Systems/$serialnumber/Metrics page
    //Redfish format: https://$host/redfish/vs/Systems/Metrics
    for (var j = 0; j < endpoints.length; j++) {
        endpoints[j] = endpoints[j] + "/Metrics";
    }
    //console.log(endpoints)
    await getBasicRedFish(endpoints, agent, basicAuth_redfish, ['ProcessorBandwidthPercent', 'MemoryBandwidthPercent', 'IOBandwidthGBps']).then((resp) => {
        //console.log(resp)
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
    });
    //Finally, getting the Power Consumption
    const regex = new RegExp('Systems\/.*$');
    for (var j = 0; j < endpoints.length; j++) {
        endpoints[j] = endpoints[j].replace(regex, 'Chassis/RackMount/Baseboard/Power');
    }
    //console.log(endpoints)
    await getBasicRedFish(endpoints, agent, basicAuth_redfish, ['PowerControl']).then((resp) => {
        //console.log(resp)
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
    });
    console.log(readData);
    devices = readData;
    if (readData.length > 0) {
        res.render('index', {
            labels: labels,
            devices: devices
        });
    }
    else {
        console.log("can not get web response, loading from local database instead ...");
        console.log("current data might be outdated, try refreshing for updates...");
        readFromCsv(path + csv, res, readData);
    }
});
router.post('/', (req, res) => {
    let req_data = req.body;
    console.log(req_data);
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
    res.send(req_data);
});
router.get('/bootdevices', (req, res) => {
    let temp = addresses_selected;
    temp['status'] = 'rebooting selected devices';
    res.send(temp);
});
router.post('/bootdevices', async (req, res) => {
    let req_data = req.body;
    addresses_selected = req_data;
    console.log(req_data);
    console.log("posted");
    const agent = new https_1.default.Agent({
        rejectUnauthorized: false
    });
    axios_1.default.post("http://localhost:5000", req_data, {
        httpsAgent: agent,
        headers: { "Authorization": basicAuth_redfish }
    })
        .then((response) => {
        //console.log(response);
    }).catch((err) => {
        console.log(err);
    });
    res.send("received");
});
function readFromCsv(path, res, readData) {
    fs_1.default.createReadStream(path)
        .pipe((0, csv_parse_1.parse)({ delimiter: ",", from_line: 2 }))
        .on("data", function (row) {
        let temp = {};
        //console.log(row);
        for (let i = 0; i < row.length; i++) {
            temp[labels[i]] = row[i];
        }
        readData.push(temp);
        //console.log(devices)
    })
        .on("end", function () {
        //console.log(devices)
        devices = readData;
        res.render('index', {
            labels: labels,
            devices: devices
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
        let newEndPoints = [];
        response.forEach((device) => {
            let host = device['value']['request'].host;
            let temp = process.env.URL_REDFISH_HOST + "://" + host + device['value']['data']['Members'][0]['@odata.id'];
            newEndPoints.push(temp);
        });
        return newEndPoints;
    }).catch((err) => {
        console.log(err);
    });
}
async function getBasicRedFish(urls, agent, basicAuth, labels) {
    return Promise.allSettled(urls.map((url) => axios_1.default.get(url, {
        httpsAgent: agent,
        headers: { "Authorization": basicAuth_redfish }
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
    }).catch(function (error) {
        console.log("error:");
        console.log(error.toJSON());
    });
}
exports.default = router;
