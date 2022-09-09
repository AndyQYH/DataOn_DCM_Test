import sqlite3, { Database } from 'sqlite3'


var schema = JSON.parse(JSON.stringify({
  "sessions": {
    "user":"REQUIRED TEXT","username":"REQUIRED TEXT","password":"REQUIRED TEXT", "device":"REQUIRED TEXT", "date":"REQUIRED TEXT UNIQUE"},
  "users": {
    "email":"REQUIRED TEXT UNIQUE","username":"REQUIRED TEXT UNIQUE","password":"REQUIRED TEXT"
  }
}));

class sqliteDB{
    name: string
    
    path: string
    db: Database
    
    constructor(name:string,path:string='/'){
      this.name = name
      this.path = path
      this.db = this.connectToDB()
    }

    connectToDB(){
        const db = new sqlite3.Database(this.path+this.name, sqlite3.OPEN_READWRITE,(err:any)=>{
          if(err){
            return console.error(err.message)
          }else{
            console.log('Connected to database ...')
          }
        })
      
        return db
      }

    disconnectFromDB(){
      this.db.close((err)=>{
        if(err){
          return console.error(err.message)
        }
      })
    }
      

    createTable(tablename:string,labels:any){
      console.log(`creating table ${tablename}`)

      let query =  `CREATE TABLE IF NOT EXISTS ${tablename} (id INTEGER PRIMARY KEY`
      for(var key in labels){
        query += `,\n${key} ${labels[key]}`
      }
  
      query +=')'
      console.log(query)
      
      this.db.run(query,(err)=>{
        if(!err){
          
          console.log(`successfully created table ${tablename}`)
          console.log('current tables(s):')
          this.getTables()
          
        }else{
          console.log(err.message)
        }
      }) 
      
    } 
        
    dropTable(tablename:string){
        this.db.run(`DROP TABLE ${tablename}`,(err)=>{
          if(!err){
            
            console.log(`successfully dropped table ${tablename}`)
            console.log('current tables(s):')
            this.getTables()
          }else{
            console.log(err.message)
          }
        })
      }

    getTables(){
      const db = this.db
     
      db.serialize(function () {
          db.each("select name from sqlite_schema where type='table'", function (err:any, table:any) {
            console.log(table);

          });
        
      });

    }
      
    insertDB(tablename:any, data:any){
        
        let params = ''
        let values = ''
 
        console.log('using default id ...')
        for(var key in schema[tablename]){
          if(params){
            params += ', '
          }
          params += `${key}`
        }

        params =  `(${params})`
       
        
        for(var i =0; i < data.length; i++){
          if(values){
            values += ', '
          }
          values += `?`
        }
        let query = `INSERT INTO ${tablename} ${params} VALUES (${values}) `

        console.log(query)
        var stmt = this.db.prepare(query, (err)=>{
          if(err){
            console.log(err.message)
          }
        })
        
        stmt.run(data,(err)=>{
          if(err){
            console.log('has error!')
            console.log(err.message)
          }else{
            console.log(`successfully inserted ${data} into ${tablename}`)
          }
        });
      
      }
      
    removeDB(tablename:any,id:any){
        let query = `DELETE FROM ${tablename} WHERE id = ? `
        this.db.run(query,id,(err)=>{
          if(err){
            return console.error(err.message)
          }else{
            console.log(`deleted ${id} from table ${tablename}` )
          }
        })
      }
      
    updateTable(tablename:any, target:any, value:any, id:any, id_num:any){
      var pairs = ''
        for(var key in schema[tablename]){
          if(pairs){
            pairs += ', '
          }
          pairs += `${key} = ${target[key]}`
        }
        let query = `UPDATE ${tablename}
                     SET ${pairs}
                     WHERE ${id} = ${id_num}
                    `
        this.db.run(query,(err)=>{
          if(err){
            return console.error(err.message)
          }else{
            console.log(`updated table ${tablename}: ${target} = ${value} where ${id} = ${id_num}` )
          }
        })
      }

    logTable(tablename:any){
      this.db.all(`SELECT * FROM ${tablename} LIMIT 10`,(err, rows)=>{
        if(err){
          throw err;
        }
        console.log(`current rows in ${tablename}:`)
        rows.forEach((row)=>{
          console.log(row)
        })
      })
    }
      
}


const db_users = new sqliteDB('users.db','databases/')


export default sqliteDB
export {db_users, schema}