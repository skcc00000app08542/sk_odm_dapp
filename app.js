var express = require('express');
var app = express();
var bodyParser = require('body-parser')

var router = require('./router/main')(app);

const pg = require('pg');
const config = require('./router/contract/config.js').config()

const db_config = {
    host: config.database_url,
    user: config.database_id,
    password: config.database_password,
    database: config.database_database,
    port: 5432,
};

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());
app.use(express.static('public'));
config_json = require( './config.json');

var server = app.listen(config.server_port, function(){
    console.log("Express server has started on port " + config.server_port)
});

app.get('/api/contract/config', (req, res) => {
    var config;
    if (process.env.NODE_ENV == "development") {
        config = config_json["dev"]["dapp_config"]; // dapp_config 만 보내야 함 그 상위에는 db 정보가 있음.
    } else if (process.env.NODE_ENV == "test") {
        config = config_json["testnet"]["dapp_config"]; // dapp_config 만 보내야 함 그 상위에는 db 정보가 있음.
    } else if (process.env.NODE_ENV == "prod") {
        config = config_json["mainnet"]["dapp_config"]; // dapp_config 만 보내야 함 그 상위에는 db 정보가 있음.
    }
    res.end(JSON.stringify({ result : config }));
})


app.post('/api/contract/save_tx', (req, res) => {
    console.log(req.body);
    const client = new pg.Client(db_config);
    var tx_hash = req.body.tx;
    var from = req.body.from;
    var to = req.body.to;
    var token = req.body.token;
    var query_str = `INSERT INTO block.tb_tx("tx", "from_addr", "to_addr", "token") VALUES ('${tx_hash}', '${from}', '${to}', '${token}')`;
    console.log(query_str)
    client.connect();
    client.query(query_str, (err, res) => {
        console.log(res);
        console.log(err);
        client.end();
    });
    res.end(JSON.stringify({ result : true }));
})

app.post('/api/contract/get_tx', (req, res) => {
    const client = new pg.Client(db_config);
    var result = {}

    client.connect();
    var address = req.body.address;
    var rows_list = []
    var input = address.toLowerCase()
    var query_str = `SELECT seq, tx, from_addr, to_addr, token, datetime FROM block.tb_tx WHERE from_addr = '${input}' or to_addr = '${input}' order by seq desc limit 3`;
    console.log(query_str);
    client.query(query_str, (sql_err, sql_res) => {
        console.log(sql_res.rows[0])
        result[input] = sql_res.rows
        res.end(JSON.stringify({ "result" : result }));
        client.end();
    });
})

app.post('/api/contract/save_winner', (req, res) => {
    const client = new pg.Client(db_config);
    var result = {}

    console.log("req.body");
    console.log(req.body);

    client.connect();
    var win_company_name    = req.body.win_company_name;
    var win_tx_hash         = req.body.win_tx_hash;
    var win_token_value     = req.body.win_token_value;
    var win_company_address = req.body.win_company_address;

    console.log("win_company_name");
    console.log(win_company_name);

    var query_str = `INSERT INTO block.tb_winner("win_company_name", "win_tx_hash", "win_token_value", "win_company_address") VALUES ('${win_company_name}', '${win_tx_hash}', '${win_token_value}', '${win_company_address}')`;
    console.log(query_str);
    client.query(query_str, (err, res) => {
        console.log(res);
        console.log(err);
        client.end();
    });
})
