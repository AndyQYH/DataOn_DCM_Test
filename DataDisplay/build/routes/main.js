"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const dotenv_1 = __importDefault(require("dotenv"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
dotenv_1.default.config();
let path = process.env.PATH_CSV;
let user = '';
const router = express_1.default.Router();
router.use(body_parser_1.default.urlencoded({ extended: false }));
router.use(body_parser_1.default.json());
router.use(express_1.default.static('public'));
router.use((0, cookie_parser_1.default)());
router.get('/', (req, res) => {
    console.log('Welcome to main page ...');
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
    if (req.cookies) {
        res.render('main', {
            layout: './layouts/main',
            user: user
        });
    }
    else {
        res.render('main', {
            layout: './layouts/main',
            user: user
        });
    }
});
router.post('/', (req, res) => {
    console.log("posted in main ...");
    console.log(req.body);
});
exports.default = router;
