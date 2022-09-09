"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const dotenv_1 = __importDefault(require("dotenv"));
const axios_1 = __importDefault(require("axios"));
const https_1 = __importDefault(require("https"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const auth_1 = require("../models/auth");
const db_1 = require("../models/db");
const auth_session_1 = require("../models/auth_session");
dotenv_1.default.config();
let addresses_selected = {};
let passwords = [];
let sessions = [];
var username_redfish;
var password_redfish;
var credentials_redfish;
var server = process.env.SERVER_URL;
const jwtSecret = process.env.TOKEN;
const router = express_1.default.Router({ mergeParams: true });
router.use(body_parser_1.default.json());
router.use((0, cookie_parser_1.default)());
router.get('/', auth_1.userAuth, (req, res) => {
    let temp = addresses_selected;
    res.send(temp);
});
router.post('/', auth_1.userAuth, auth_session_1.sessionAuth, async (req, res) => {
    var resp;
    var token = req.cookies.jwt;
    console.log("posted in device actions ...");
    addresses_selected = req.body;
    console.log(req.body);
    console.log(req.body.credentials);
    console.log(req.body.sessions);
    if (req.body.credentials != null && req.body.credentials != undefined && req.body.credentials.length > 0) {
        console.log('for redfish scripting');
        var req_data = req.body;
        var maxAge = 1 * 60 * 1000;
        var date;
        console.log('params');
        console.log(req.params);
        var [username_redfish, ...date] = req.body.credentials[0].split(':');
        date = date.join(':').replace(' ', '');
        console.log(username_redfish);
        console.log(date);
        const decode = await db_1.db_users.get('SELECT * FROM sessions WHERE user = ? AND username = ? AND date = ?', [req.params.id, username_redfish, date]);
        password_redfish = decode.password;
        console.log('password_redfish');
        console.log(password_redfish);
        credentials_redfish = Buffer.from(username_redfish + ":" + password_redfish).toString('base64');
        var basicAuth_redfish = 'Basic ' + credentials_redfish;
        req_data['credentials'] = [username_redfish, password_redfish];
        const agent = new https_1.default.Agent({
            rejectUnauthorized: false
        });
        await axios_1.default.post(server, req_data, {
            httpsAgent: agent,
            headers: { "Authorization": basicAuth_redfish }
        })
            .then((response) => {
            resp = response.data;
            console.log(resp);
            if (resp == undefined || resp == null) {
                resp = "error-server";
            }
            else {
                res.cookie(username_redfish + ":" + date, req.params.id, {
                    httpOnly: true,
                    maxAge: maxAge, // 3hrs in ms
                });
            }
        }).catch((err) => {
            if (err) {
                res.cookie(username_redfish + ":" + date, req.params.id, {
                    httpOnly: true,
                    maxAge: 1, // 3hrs in ms
                });
            }
            console.log(err);
        });
        res.send(resp);
    }
    else if (req.body.sessions != null && req.body.sessions != undefined && req.body.sessions.length > 0) {
        sessions = req.body.sessions;
        passwords = req.body.passwords;
        console.log("sessions");
        console.log(sessions);
        console.log("passwords");
        console.log(passwords);
    }
    else {
        console.log('other commands');
    }
});
exports.default = router;
