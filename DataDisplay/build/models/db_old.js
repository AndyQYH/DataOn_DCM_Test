"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.schema = exports.db_users = void 0;
const sqlite3_1 = __importDefault(require("sqlite3"));
var schema = JSON.parse(JSON.stringify({
    "sessions": {
        "user": "REQUIRED TEXT", "username": "REQUIRED TEXT", "password": "REQUIRED TEXT", "device": "REQUIRED TEXT", "date": "REQUIRED TEXT UNIQUE"
    },
    "users": {
        "email": "REQUIRED TEXT UNIQUE", "username": "REQUIRED TEXT UNIQUE", "password": "REQUIRED TEXT"
    }
}));
exports.schema = schema;
class sqliteDB {
    name;
    path;
    db;
    constructor(name, path = '/') {
        this.name = name;
        this.path = path;
        this.db = this.connectToDB();
    }
    connectToDB() {
        const db = new sqlite3_1.default.Database(this.path + this.name, sqlite3_1.default.OPEN_READWRITE, (err) => {
            if (err) {
                return console.error(err.message);
            }
            else {
                console.log('Connected to database ...');
            }
        });
        return db;
    }
    disconnectFromDB() {
        this.db.close((err) => {
            if (err) {
                return console.error(err.message);
            }
        });
    }
    createTable(tablename, labels) {
        console.log(`creating table ${tablename}`);
        let query = `CREATE TABLE IF NOT EXISTS ${tablename} (id INTEGER PRIMARY KEY`;
        for (var key in labels) {
            query += `,\n${key} ${labels[key]}`;
        }
        query += ')';
        console.log(query);
        this.db.run(query, (err) => {
            if (!err) {
                console.log(`successfully created table ${tablename}`);
                console.log('current tables(s):');
                this.getTables();
            }
            else {
                console.log(err.message);
            }
        });
    }
    dropTable(tablename) {
        this.db.run(`DROP TABLE ${tablename}`, (err) => {
            if (!err) {
                console.log(`successfully dropped table ${tablename}`);
                console.log('current tables(s):');
                this.getTables();
            }
            else {
                console.log(err.message);
            }
        });
    }
    getTables() {
        const db = this.db;
        db.serialize(function () {
            db.each("select name from sqlite_schema where type='table'", function (err, table) {
                console.log(table);
            });
        });
    }
    insertDB(tablename, data) {
        let params = '';
        let values = '';
        console.log('using default id ...');
        for (var key in schema[tablename]) {
            if (params) {
                params += ', ';
            }
            params += `${key}`;
        }
        params = `(${params})`;
        for (var i = 0; i < data.length; i++) {
            if (values) {
                values += ', ';
            }
            values += `?`;
        }
        let query = `INSERT INTO ${tablename} ${params} VALUES (${values}) `;
        console.log(query);
        var stmt = this.db.prepare(query, (err) => {
            if (err) {
                console.log(err.message);
            }
        });
        stmt.run(data, (err) => {
            if (err) {
                console.log('has error!');
                console.log(err.message);
            }
            else {
                console.log(`successfully inserted ${data} into ${tablename}`);
            }
        });
    }
    removeDB(tablename, id) {
        let query = `DELETE FROM ${tablename} WHERE id = ? `;
        this.db.run(query, id, (err) => {
            if (err) {
                return console.error(err.message);
            }
            else {
                console.log(`deleted ${id} from table ${tablename}`);
            }
        });
    }
    updateTable(tablename, target, value, id, id_num) {
        var pairs = '';
        for (var key in schema[tablename]) {
            if (pairs) {
                pairs += ', ';
            }
            pairs += `${key} = ${target[key]}`;
        }
        let query = `UPDATE ${tablename}
                     SET ${pairs}
                     WHERE ${id} = ${id_num}
                    `;
        this.db.run(query, (err) => {
            if (err) {
                return console.error(err.message);
            }
            else {
                console.log(`updated table ${tablename}: ${target} = ${value} where ${id} = ${id_num}`);
            }
        });
    }
    logTable(tablename) {
        this.db.all(`SELECT * FROM ${tablename} LIMIT 10`, (err, rows) => {
            if (err) {
                throw err;
            }
            console.log(`current rows in ${tablename}:`);
            rows.forEach((row) => {
                console.log(row);
            });
        });
    }
}
const db_users = new sqliteDB('users.db', 'databases/');
exports.db_users = db_users;
exports.default = sqliteDB;
