"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const dotenv_1 = __importDefault(require("dotenv"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const db_1 = require("../models/db");
const auth_1 = require("../models/auth");
dotenv_1.default.config();
let sessions = [];
const server = process.env.SERVER_URL;
let table = 'sessions';
let cols = db_1.schema[table];
let user = '';
db_1.db_users.db.serialize(function () {
    db_1.db_users.dropTable(table);
    db_1.db_users.createTable(table, cols);
    db_1.db_users.insertDB(table, ['guest', 'admin', 'admin1', 'any', 'anytime admin']);
    db_1.db_users.insertDB(table, ['123', 'guest user', 'any', 'any', 'something']);
    db_1.db_users.insertDB(table, ['123', 'guest user', 'any', 'any', 'random']);
    db_1.db_users.logTable(table);
});
const router = express_1.default.Router({ mergeParams: true });
router.use(body_parser_1.default.urlencoded({ extended: false }));
router.use(body_parser_1.default.json());
router.use((0, cookie_parser_1.default)());
router.get('/', auth_1.userAuth, async (req, res) => {
    if (req.cookies) {
        console.log('has cookies');
        console.log(req.cookies);
        user = req.cookies.user;
    }
    else {
        user = '';
    }
    const temp = await db_1.db_users.all(`SELECT * FROM ${table} WHERE user = ? ORDER BY ?`, [user, 'username']);
    res.send(temp);
});
router.post('/', auth_1.userAuth, async (req, res) => {
    console.log("posted in sessions");
    console.log(req.body);
    if (req.cookies) {
        console.log('has cookies');
        console.log(req.cookies);
        user = req.cookies.user;
    }
    else {
        user = '';
    }
    if (req.body.username) {
        const { username, password, device, date } = req.body;
        const row = await db_1.db_users.get(`SELECT * FROM ${table} WHERE user = ? AND username = ? AND password = ?`, [req.params.id, username, password]);
        if (row) {
            //response validate data to register.ejs
            console.log('has errors!');
            res.status(401).send('Issues encountered when creating session... Try different username/password...');
        }
        else {
            console.log('successfully created session ...');
            var maxAge = 3 * 60;
            db_1.db_users.insertDB(table, [user, username, password, device, date]);
            res.cookie(username + ':' + date, user, {
                httpOnly: true,
                maxAge: maxAge * 1000, // 3hrs in ms
            });
            res.status(200).send('success');
        }
    }
    else if (req.body.username_disabled) {
        const { username_disabled, password, device, date } = req.body;
        const username = username_disabled.split(':')[0].replace(' ', '');
        const row = await db_1.db_users.get(`SELECT * FROM ${table} WHERE user = ? AND username = ? AND password = ?`, [req.params.id, username, password]);
        if (!row) {
            //response validate data to register.ejs
            console.log('has errors!');
            res.status(401).send('Issues encountered when loggin into session... Try again...');
        }
        else {
            console.log('successfully logged into session ...');
            var maxAge = 3 * 60;
            res.cookie(username_disabled.replace(' ', ''), req.params.id, {
                httpOnly: true,
                maxAge: maxAge * 1000, // 3hrs in ms
            });
            res.status(200).send('success');
        }
    }
    else {
        console.log('error!');
        res.status(400).send('An error has ocurred, try again later ...');
    }
});
exports.default = router;
