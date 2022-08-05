"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const express_ejs_layouts_1 = __importDefault(require("express-ejs-layouts"));
const body_parser_1 = __importDefault(require("body-parser"));
const method_override_1 = __importDefault(require("method-override"));
const index_1 = __importDefault(require("./routes/index"));
if (process.env.NODE_ENV !== 'production') {
    dotenv_1.default.config();
}
const app = (0, express_1.default)();
const PORT = parseInt(process.env.PORT);
const HOST = process.env.SERVER;
console.log("port: " + PORT);
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
app.set('layout', 'layouts/layout');
app.use(express_ejs_layouts_1.default);
app.use((0, method_override_1.default)('_method'));
app.use('/', index_1.default);
app.use('/devices', index_1.default);
app.use(express_1.default.static('public'));
app.use(express_1.default.static('node_modules'));
app.use(body_parser_1.default.urlencoded({ extended: true }));
app.listen(PORT, () => {
    console.log(`[server]: Server is running at http://localhost:${PORT}`);
});
