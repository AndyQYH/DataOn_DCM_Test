"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.schema = exports.db_users = void 0;
const sqlite3_1 = __importDefault(require("sqlite3"));
var schema = JSON.parse(JSON.stringify({
    "sessions": {
        "user": "REQUIRED TEXT", "username": "REQUIRED TEXT", "password": "REQUIRED TEXT", "device": "REQUIRED TEXT", "date": "REQUIRED TEXT"
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
        return new Promise((resolve, reject) => {
            this.db.run(query, (err) => {
                if (err)
                    console.log("Read error: " + err.message);
                else {
                    console.log(`succesfully created table ${tablename}`);
                }
            });
        }).catch((error) => {
            console.error(error);
        });
    }
    dropTable(tablename) {
        return new Promise((resolve, reject) => {
            this.db.run(`DROP TABLE ${tablename}`, (err) => {
                if (err)
                    console.log("Read error: " + err.message);
                else {
                    console.log(`succesfully dropped table ${tablename}`);
                }
            });
        }).catch((error) => {
            console.error(error);
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
        for (var key in schema[tablename]) {
            if (params) {
                params += ', ';
            }
            params += `${key}`;
        }
        let values = '';
        for (var i = 0; i < data.length; i++) {
            if (values) {
                values += ', ';
            }
            values += `?`;
        }
        let query = `INSERT INTO ${tablename} (${params}) VALUES (${values}) `;
        console.log(query);
        return new Promise((resolve, reject) => {
            var stmt = this.db.prepare(query, (err) => {
                if (err)
                    console.log("Read error: " + err.message);
            });
            stmt.run(data, (err) => {
                if (err)
                    console.log("Read error: " + err.message);
                else {
                    console.log(`successfully inserted ${data} into ${tablename}`);
                }
            });
        }).catch((error) => {
            console.error(error);
        });
    }
    removeDB(tablename, id) {
        let query = `DELETE FROM ${tablename} WHERE id = ? `;
        return new Promise((resolve, reject) => {
            this.db.run(query, id, (err) => {
                if (err)
                    console.log("Read error: " + err.message);
                else {
                    console.log(`deleted ${id} from table ${tablename}`);
                }
            });
        }).catch((error) => {
            console.error(error);
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
        return new Promise((resolve, reject) => {
            this.db.run(query, (err) => {
                if (err)
                    console.log("Read error: " + err.message);
                else {
                    console.log(`updated table ${tablename}: ${target} = ${value} where ${id} = ${id_num}`);
                }
            });
        }).catch((error) => {
            console.error(error);
        });
    }
    logTable(tablename) {
        console.log(`logging table ${tablename}`);
        return new Promise((resolve, reject) => {
            this.db.all(`SELECT * FROM ${tablename} LIMIT 10`, (err, rows) => {
                if (err)
                    console.log("Read error: " + err.message);
                else {
                    console.log(rows);
                    resolve(rows);
                }
            });
        }).catch((error) => {
            console.error(error);
        });
    }
    get(query, params) {
        return new Promise((resolve, reject) => {
            this.db.get(query, params, function (err, row) {
                if (err)
                    console.log("Read error: " + err.message);
                else {
                    resolve(row);
                }
            });
        }).catch((error) => {
            console.error(error);
        });
    }
    all(query, params) {
        return new Promise((resolve, reject) => {
            this.db.all(query, params, function (err, rows) {
                if (err)
                    console.log("Read error: " + err.message);
                else {
                    resolve(rows);
                }
            });
        }).catch((error) => {
            console.error(error);
        });
    }
}
const db_users = new sqliteDB('users.db', 'databases/');
exports.db_users = db_users;
exports.default = sqliteDB;
