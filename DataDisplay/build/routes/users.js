"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const dotenv_1 = __importDefault(require("dotenv"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_old_1 = require("../models/db_old");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
dotenv_1.default.config();
let msg = '';
let user = '';
let table = 'users';
let cols = db_old_1.schema[table];
let jwtSecret = process.env.TOKEN;
db_old_1.db_users.db.serialize(async function () {
    db_old_1.db_users.dropTable(table);
    db_old_1.db_users.createTable(table, cols);
    let hash = await bcrypt_1.default.hash('123', 10);
    db_old_1.db_users.insertDB(table, ['123@123.com', '123', hash]);
    db_old_1.db_users.insertDB(table, ['', 'guest', '']);
    db_old_1.db_users.logTable(table);
});
const router = express_1.default.Router();
router.use(body_parser_1.default.urlencoded({ extended: false }));
router.use(body_parser_1.default.json());
router.use(express_1.default.static('public'));
router.use((0, cookie_parser_1.default)());
router.get('/', (req, res) => {
    console.log('welcome to Login ...');
    if (req.cookies) {
        console.log('has cookies');
        console.log(req.cookies);
        user = req.cookies.user;
    }
    else {
        user = '';
    }
    console.log('user now is:');
    console.log(user);
    res.render('user-login', {
        layout: './layouts/users',
        userAction: 'Log in',
        user: user
    });
});
router.post('/', async (req, res) => {
    console.log("posted in login ...");
    console.log("got log-in post", req.body);
    const { username, password } = req.body;
    if (username && password) {
        db_old_1.db_users.db.get("SELECT * FROM users WHERE username = ? OR email = ? LIMIT 1", [username, username], async function (err, row) {
            if (!row) {
                msg = 'username/email does not exist!';
                console.log(msg);
                res.status(400).send(msg);
            }
            else if (err) {
                msg = err.message;
                console.log(msg);
                res.status(500).send(msg);
            }
            else {
                const validPass = await bcrypt_1.default.compare(password, row.password);
                if (!validPass) {
                    msg = 'incorrect username/password';
                    console.log(msg);
                    res.status(400).send(msg);
                }
                else {
                    const maxAge = 5 * 60;
                    const token = jsonwebtoken_1.default.sign({ id: row.id, username }, jwtSecret, {
                        expiresIn: maxAge, // 3hrs in sec
                    });
                    console.log(token);
                    res.cookie("jwt", token, {
                        httpOnly: true,
                        maxAge: maxAge * 1000, // 3hrs in ms
                    });
                    res.cookie('user', username, {
                        httpOnly: true,
                        maxAge: maxAge * 1000
                    });
                    msg = 'successfully logged in!';
                    console.log(msg);
                    res.status(200).json({ msg: msg, user: username });
                }
            }
        });
    }
    else {
        res.send("username and password are required");
    }
});
router.get('/register', (req, res) => {
    console.log('welcome to Register ...');
    if (req.cookies) {
        console.log(req.cookies);
        user = req.cookies.user;
    }
    else {
        user = '';
    }
    console.log('user now is:');
    console.log(user);
    res.render('user-register', {
        layout: './layouts/users',
        userAction: 'Sign up',
        user: user
    });
});
router.post('/register', async (req, res) => {
    const { username, password, email } = req.body;
    console.log("posted in register ...");
    console.log("got register post", req.body);
    if (username && password && email) {
        console.log('verifying registration  ...');
        const password_hash = await bcrypt_1.default.hash(password, 10);
        db_old_1.db_users.db.get("SELECT * FROM users WHERE username = ? OR email = ? LIMIT 1", [username, email], function (err, row) {
            if (row) {
                msg = 'username/email already in use!';
                console.log(msg);
                res.status(400).send(msg);
            }
            else if (err) {
                msg = err.message;
                console.log(msg);
                res.status(401).send(msg);
            }
            else {
                db_old_1.db_users.insertDB(table, [email, username, password_hash]);
                msg = 'success';
                console.log(msg);
                res.status(200).send(msg);
            }
        });
    }
    else {
        res.send("username and password are required");
    }
});
exports.default = router;
