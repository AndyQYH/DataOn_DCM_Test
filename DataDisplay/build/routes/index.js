"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const dotenv_1 = __importDefault(require("dotenv"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const devices_1 = __importDefault(require("./devices"));
const sessions_1 = __importDefault(require("./sessions"));
const db_1 = require("../models/db");
const Redfish_DCM_1 = require("../models/Redfish_DCM");
const auth_1 = require("../models/auth");
dotenv_1.default.config();
//variables declarations
//----------------------------------------------------------------------------------------------------------
let devices = [];
let addresses_global = [];
let sessions = [];
let user = '';
const labels = ['Node', 'BMC IP address', 'Status', 'Model', 'Serial Number', 'Indicator LED', 'CPU', 'Memory', 'IO', 'Power'];
const target = ['10.4.7.43', '10.4.7.79'];
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
//--------------------------------------------------------------------------------------------------------------------------------
//Router Functions
//--------------------------------------------------------------------------------------------------------------------------------
const router = express_1.default.Router();
router.use((0, cookie_parser_1.default)());
router.use(body_parser_1.default.json());
router.use('/:id/sessions', sessions_1.default);
router.use('/:id/device-actions', devices_1.default);
router.use(express_1.default.static('public'));
router.get('/:id', auth_1.userAuth, async (req, res) => {
    addresses_global = [];
    if (req.cookies) {
        console.log('has cookies');
        console.log(req.cookies);
        user = req.params.id;
    }
    else {
        user = '';
    }
    console.log('user now is:');
    console.log(user);
    await (0, Redfish_DCM_1.Redfish_DCM_Cycle)(addresses_global, url_dcm, basicAuth_dcm, basicAuth_redfish, target).then((resp) => {
        //console.log(resp)
        devices = resp;
    });
    sessions = await db_1.db_users.all(`SELECT * FROM sessions WHERE user = ?`, user);
    //console.log(devices)
    console.log('sessions');
    console.log(sessions);
    if (devices.length > 0 && sessions != undefined) {
        res.render('index', {
            labels: labels,
            devices: devices,
            sessions: sessions,
            status: 200,
            user: user
        });
    }
    else {
        console.log("can not get web response, loading from local database instead ...");
        console.log("current data might be outdated, try refreshing for updates...");
        res.render('index', {
            labels: labels,
            devices: [],
            sessions: [],
            status: 200,
            user: user
        });
    }
});
//router to handle post requests on / page
router.post('/:id', (req, res) => {
    let host = req.headers.host;
    let errors = [];
    var password;
    var username;
    var device;
    var date;
    console.log("inside post");
    console.log(host);
    console.log('POST in Index:');
    console.log(req.body);
    if (req.body.errors) {
        errors = req.body;
    }
    if (req.body) {
        username = req.body.username;
        password = req.body.password;
        device = req.body.device;
        date = req.body.date;
    }
    res.send('received');
});
router.get("/:id/sign-out", (req, res) => {
    res.cookie("jwt", "", { maxAge: 1 });
    res.cookie("user", "", { maxAge: 1 });
    res.redirect("/");
});
exports.default = router;
