"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userAuth = exports.adminAuth = void 0;
const db_1 = require("../models/db");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const jwtSecret = process.env.TOKEN;
var adminAuth = (req, res, next) => {
    console.log(req.headers);
    const token = req.cookies.jwt;
    if (token) {
        jsonwebtoken_1.default.verify(token, jwtSecret, (err, decodedToken) => {
            if (err) {
                return res.status(401).json({ message: "Not authorized" });
            }
            else {
                if (decodedToken.role !== "admin") {
                    return res.status(401).json({ message: "Not authorized" });
                }
                else {
                    next();
                }
            }
        });
    }
    else {
        return res
            .status(401)
            .json({ message: "Not authorized, token not available" });
    }
};
exports.adminAuth = adminAuth;
var userAuth = async (req, res, next) => {
    const token = req.cookies.jwt;
    var msg = '';
    var status = 400;
    var url = req.protocol + '://' + req.get('host') + req.originalUrl;
    console.log(req.cookies);
    console.log(url);
    console.log(token);
    if (req.params.id != null || req.params.id != undefined) {
        console.log('id');
        console.log(req.params.id);
        const result = await db_1.db_users.get("SELECT * FROM users WHERE username = ?", req.params.id);
        console.log(result);
        if (!result) {
            status = 404;
            msg = 'No such route';
        }
        else {
            if (result.username == 'guest') {
                next();
                return;
            }
            else {
                msg = 'exists';
            }
        }
        if (msg != 'exists') {
            return res.render('index', {
                layout: './layouts/main',
                status: status,
                msg: msg,
                user: req.cookies.user
            });
        }
    }
    if (token) {
        jsonwebtoken_1.default.verify(token, jwtSecret, (err, decodedToken) => {
            console.log('decode token');
            console.log(decodedToken);
            if (err) {
                console.log('error!');
                return res.render('index', {
                    layout: './layouts/main',
                    status: 401,
                    msg: "Not authorized",
                    user: ''
                });
            }
            else {
                if (decodedToken.username !== req.params.id) {
                    return res.render('index', {
                        layout: './layouts/main',
                        status: 401,
                        msg: "Not authorized for this page ...",
                        user: decodedToken.username
                    });
                }
                else {
                    next();
                }
            }
        });
    }
    else {
        console.log('no tokens ...');
        if (!(url.split('/').slice(-1)[0] != req.params.id)) {
            console.log('user main page ...');
            return res.render('index', {
                layout: './layouts/main',
                status: 401,
                msg: "Not authorized, token not available",
                user: ''
            });
        }
        else {
            console.log('not user main page ...');
            return res.status(401).send('Session Timeout');
        }
    }
};
exports.userAuth = userAuth;
