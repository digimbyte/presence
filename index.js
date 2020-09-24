/*jshint esversion: 10 */
import Koa from 'koa';              // https://www.npmjs.com/package/koa
import helmet from 'koa-helmet';    // https://www.npmjs.com/package/koa-helmet
import KoaRouter from 'koa-router';

import fs from 'fs';


import cors from 'cors';
import bodyParser from 'body-parser';
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
const seedCount = 2048;
const app = new Koa();
const router = new KoaRouter();

const seeds = [];

///////////////////
// SETUP EXPRESS 
///////////////////

// app.use(helmet());

// // adding Helmet to enhance your API's security
// app.use(helmet());

// // using bodyParser to parse JSON bodies into JS objects
// app.use(bodyParser.json());

// // enabling CORS for all requests
// app.use(cors());

// // adding morgan to log HTTP requests
// app.use(morgan.default('combined'));

// app.locals.pretty = true;

///////////////////
// RUN EXPRESS 
///////////////////
// app.use(async ctx => (ctx.body = {}));




router.get('/', (ctx, next) => {
    // ctx.router available
});

// APP MIDDLEWARE
app
    .use(router.routes())
    .use(router.allowedMethods());
// APP LISTENERS
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));



router.get("/", (req, res) => res.send());
router.get("/online/:appID", (req, res) => {
    if (!req.params.appID) { res.send('invalid or missing app id'); return; }
    if (!req.body.users) { res.send('invalid or missing users string[]'); return; }
    if (registry[validator.escape(req.params.appID)] && Array.isArray(req.body.users)) {
        res.send(Object.entries(registry[validator.escape(req.params.appID)]).filter(([x, y]) => req.body.users.includes(x)).map(i => ({ [i[0]]: i[1].status })
        ));
        return;
    }
    res.send([]);

});

router.get("/ping", context => context.body = { message: "pong" });//(req, res) => res.send("pong"));

router.get("/unique", (req, res) => {
    const seed = seeds.shift();
    res.send([Date.getTime().toString(16),Math.floor(Math.random()*(seed))].join('-'));
});
router.get("/timestamp", (req, res) => res.send(Date.getTime()));
// https://stormpath.com/blog/nodejs-jwt-create-verify
// you share the secret with the 3rd party server before hand (this is when 3rd party owner register on your site) (happens only one time and never show the secret again)
// 1. 3rd party client app request JWT from 3rd party server (you don't give a fuck about what mechanism they're using)
// 2. 3rd party server make a JWT signed with the pre-shared secret (let's say it's valid for half hour)
// 3. 3rd party client make a request to your server with the JWT attached
// 4. Your server verify the JWT with the shared secret and write to database

router.put("/update/:appID", async (req, res) => {
    // All values exist?
    if (!req.body.user) res.send("invalid user id");
    else if (!req.params.appID) res.send("invalid App id");
    else {
        // Check timestamp
        // Decode JWT
        // Once Verified, append to objects
        try {
            if (!registry[validator.escape(req.params.appID)]) registry[validator.escape(req.params.appID)] = {};
            registry[validator.escape(req.params.appID)][validator.escape(req.body.user)] = {
                status: status.online,
                timestamp: new Date(Date.now() + 3000).getTime()
            };
            res.send('success');
        }
        catch (e) {
            console.warn(e);
            res.send(e);
        }
    }
    return;

});

/////////////////////
// PROCESS OFFLINE
/////////////////////
function cleanup() {
    for (var app in registry) {
        if (Object.keys(registry[app]).length == 0) { delete registry[app]; continue; }
        const timeout = new Date(Date.now() - 30000).getTime();
        const offline = new Date(Date.now() - 60000).getTime();
        for (var user in registry[app]) {
            if (registry[app][user].timestamp < timeout && registry[app][user].timestamp > offline) {
                registry[app][user].status = status.timeout;
            }
            else if (registry[app][user].timestamp < offline) {
                delete registry[app][user];
            }
        }
    }
    KeyGeneration();
}
setInterval(() => cleanup(), 5000);
async function KeyGeneration(){
    if(seeds.length < seedCount)
    [...Array(seedCount - seeds.length)].map((_, i) => {
        seeds.push(Math.floor(Math.random * 9.99)+2);
      });
}