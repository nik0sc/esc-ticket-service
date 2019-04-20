const express = require('express');
const app = express();
const bodyparser = require('body-parser');
const cors = require('cors');

const tickets_router = require('./routers/tickets');
const attachments_router = require('./routers/attachments');
const common = require('./middleware/common');

app.use(bodyparser.json());

const port = (typeof process.env.PORT !== 'undefined')
        ? parseInt(process.env.PORT) : 8000;

app.locals.knex = require('knex')({
    client: 'mysql2',
    connection: process.env.DATABASE_URL
});

app.locals.acn_axios = require('axios').create({
    baseURL: 'https://ug-api.acnapiv3.io/swivel/acnapi-common-services/common',
    timeout: 3000,
    headers: {
        'Server-Token': process.env.ACN_SERVER_TOKEN,
        'Content-Type': 'application/json'  
    }
});

if (typeof process.env.USER_SERVICE_BASE_URL === 'undefined') {
    console.error('USER_SERVICE_BASE_URL is not in environment');
} 

app.locals.user_axios = require('axios').create({
    baseURL: process.env.USER_SERVICE_BASE_URL,
    timeout: 3000,
    headers: {
        'Content-Type': 'application/json'
    }
});

app.use(cors({
    origin: common.xhrOrigins
}));
app.options('*', (req, res) => {
    res.end();
});

// Allow XHR from some places only
// app.use(common.xhrAllowWhitelistOrigins);

function info(req, res) {
    res.json({
        name: 'esc-ticket-service',
        rev: (typeof process.env.GIT_REV === 'undefined') 
                ? 'Not deployed'
                : process.env.GIT_REV
    });
}
app.get('/', info);
app.get('/version', info);

app.use('/ticket', tickets_router);
app.use('/attachment', attachments_router);

app.listen(port, () => {
    console.log(`Example app listening on port ${port}!`);
});
