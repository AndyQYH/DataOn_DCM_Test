"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Redfish_DCM_Cycle = exports.getConnectionDCM = exports.getConnectionRedFish = exports.getBasicRedFish = void 0;
const axios_1 = __importDefault(require("axios"));
const https_1 = __importDefault(require("https"));
//--------------------------------------------------------------------------------------------------------------------
//Utility Functions
//--------------------------------------------------------------------------------------------------------------------
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
exports.getConnectionRedFish = getConnectionRedFish;
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
exports.getBasicRedFish = getBasicRedFish;
async function getBasicRedFishAxios(urls, agent, basicAuth, labels) {
    return axios_1.default.all(urls.map((url) => axios_1.default.get(url, {
        httpsAgent: agent,
        headers: { "Authorization": basicAuth }
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
        console.log(error.message);
    });
}
exports.getConnectionDCM = getConnectionDCM;
async function Redfish_DCM_Cycle(addresses_global, url_dcm, basicAuth_dcm, basicAuth_redfish, target) {
    let endpoints = [];
    let readData = [];
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
        await getBasicRedFish(endpoints, agent, basicAuth_redfish, ['PowerState', 'Model', 'SerialNumber', 'IndicatorLED', 'Boot'])
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
                            ...{ 'IndicatorLED': '', 'Boot': resp[0]['Boot'] }
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
    return readData;
}
exports.Redfish_DCM_Cycle = Redfish_DCM_Cycle;
