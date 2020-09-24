/*jshint esversion: 8 */
import express from 'express';

import fs from 'fs';
import moment from 'moment-timezone';


import cors from 'cors';
import bodyParser from 'body-parser';
import helmet from 'helmet';
import validator from 'validator';
//import morgan from 'morgan';
// REFERENCE: https://auth0.com/blog/node-js-and-express-tutorial-building-and-securing-restful-apis/#Building-and-Securing-RESTful-APIs

///////////////////////
// PROCESSS CONSTANTS
///////////////////////
const status = {
    online: "Online",
    timeout: "TimeOut",
    offline: "Offline"
};
const registry = {};
const PORT = 2087;
const app = express();

// 
// 80
// 8080
// 8880
// 2052
// 2082
// 2086
// 2095
// HTTPS ports supported by Cloudflare:
// 
// 443
// 2053
// 2083
// 2087
// 2096
// 8443

///////////////////
// SETUP EXPRESS 
///////////////////

// adding Helmet to enhance your API's security
app.use(helmet());

// using bodyParser to parse JSON bodies into JS objects
app.use(bodyParser.json());

// enabling CORS for all requests
app.use(cors());

// // adding morgan to log HTTP requests
// app.use(morgan.default('combined'));

app.locals.pretty = true;

///////////////////
// RUN EXPRESS 
///////////////////
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
app.get("/", (req, res) => res.send());
app.get("/online/:appID", (req, res) => {
    if (!req.params.appID) { res.send('invalid or missing app id'); return; }
    if (!req.body.users) { res.send('invalid or missing users string[]'); return; }
    if (registry[validator.escape(req.params.appID)] && Array.isArray(req.body.users)) {
        res.send(Object.entries(registry[validator.escape(req.params.appID)]).filter(([x, y]) => req.body.users.includes(x)).map(i => ({ [i[0]]: i[1].status })
        ));
        return;
    }
    res.send([]);

});

app.get("/ping", (req, res) => res.send("pong"));

app.get("/timestamp", (req, res) => res.send(
    moment().unix()
));



app.put("/update/:appID", async (req, res) => {
    try {
        if (!req.body.user) {
            res.send("invalid user id");
            return;
        }

        else {
            console.log(req.params);
            console.log(req.body.user);
            if (!registry[validator.escape(req.params.appID)]) registry[validator.escape(req.params.appID)] = {};
            registry[validator.escape(req.params.appID)][validator.escape(req.body.user)] = {
                status: status.online,
                timestamp: moment().add(3, 'seconds').unix()
            };
            res.send('success');
            return;
        }
    }
    catch (e) {
        console.warn(e);
        res.send(e);
        return;
    }
});

/////////////////////
// PROCESS OFFLINE
/////////////////////
function cleanup() {
    for (var app in registry) {
        if (Object.keys(registry[app]).length == 0) { delete registry[app]; continue; }
        for (var user in registry[app]) {

            const timeout = moment().subtract(10, 'seconds').unix();
            const offline = moment().subtract(30, 'seconds').unix();

            if (registry[app][user].timestamp < timeout && registry[app][user].timestamp > offline) {
                registry[app][user].status = status.timeout;
            }
            else if (registry[app][user].timestamp < offline) {
                delete registry[app][user];
            }
        }
    }
}
setInterval(() => cleanup(), 5000);