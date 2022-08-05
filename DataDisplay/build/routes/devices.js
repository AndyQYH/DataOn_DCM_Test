"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const router = express_1.default.Router();
router.use(body_parser_1.default.json());
router.get('/', (req, res) => {
    res.render('index', {
        devices: req.body
    });
});
router.post('/', (req, res) => {
    console.log(req.body);
    console.log(typeof req.body);
    let devices = req.body;
    res.render('index', {
        devices: devices
    });
});
exports.default = router;
