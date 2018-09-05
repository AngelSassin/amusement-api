var MongoClient = require('mongodb').MongoClient;
var mongodb;

//db.getCollection('users').find({"cards":{"$elemMatch":{"name":"legendary_master"}}})
const fs = require('fs');
const _ = require('lodash');
const express = require('express');
const app = express();
const port = 700;

//const userManager = require('./routes/user');
//const cardManager = require('./routes/cards');
//const leadManager = require('./routes/lead');
const general = require('./routes/general');
const collections = require("./modules/collections");
const stats = require("./modules/stats");
//const f = require("./modules/formatter");

var url = 'mongodb://localhost:27017/amusement'
MongoClient.connect(url).then(db => {
    mongodb = db;
    console.log("[OK] Connected to DB!");

    //userManager.connect(db);
    //cardManager.connect(db);
    //leadManager.connect(db);
    general.connect(db);
    collections.connect(db);
    stats.connect(db);

}).catch(err => { console.log("[ERR] Can't connect to DB!\n" + err) });

app.listen(port, 'localhost', (err) => {
    if (err) return console.log('[ERROR]', err);

    console.log(`[OK] Server is listening on ${port}`);
});

app.get('/', (req, resp) => {
    resp.send('Amusement Club API service v1.0');
});

app.get('/getindex', async (req, resp) => {
    console.log('GET /getindex');
    let c = await general.getIndex();
    resp.send(c);
});

/*app.get('/user', (req, resp) => {
    let p = req.query;
    console.log('GET /user ' + p.uid);
    userManager.getUserApi(p.uid).then(u => {
        resp.send(u);
    }).catch(e => resp.send(f.error(e)));
});

app.get('/user/claim', (req, resp) => {
    let p = req.query;
    console.log('GET /user/claim ' + p);
    userManager.claim(p.uid, p.amount).then((obj) => {
        resp.send(obj);
    }).catch(e => resp.send(f.error(e)));
});

app.get('/user/pay', (req, resp) => {
    let p = req.query;
    console.log('GET /user/pay ' + p);
    userManager.pay(p.uid, p.toid, p.amount).then((obj) => {
        resp.send(obj);
    }).catch(e => {resp.send(f.error(e)); console.log(e)});
});

app.get('/user/whohas', (req, resp) => {
    let p = req.query;
    console.log('GET /user/whohas ' + p);
    userManager.whohas(p.uid, p.card).then((obj) => {
        resp.send(obj);
    }).catch(e => {resp.send(f.error(e)); console.log(e)});
});

app.get('/user/daily', (req, resp) => {
    let p = req.query;
    console.log('GET /user/daily ' + p);
    userManager.daily(p.uid).then((obj) => {
        resp.send(obj);
    }).catch(e => {resp.send(f.error(e)); console.log(e)});
});

app.get('/user/bal', (req, resp) => {
    let p = req.query;
    console.log('GET /user/bal ' + p);
    userManager.balance(p.uid, p.amount).then((obj) => {
        resp.send(obj);
    }).catch(e => {resp.send(f.error(e)); console.log(e)});
});

app.get('/user/award', (req, resp) => {
    let p = req.query;
    console.log('GET /user/award ' + p);
    userManager.award(p.uid, p.amount).then((obj) => {
        resp.send(obj);
    }).catch(e => {resp.send(f.error(e)); console.log(e)});
});

app.get('/user/card', (req, resp) => {
    let p = req.query;
    console.log('GET /user/card ' + p);
    userManager.findCard(p.uid, p.card).then((obj) => {
        resp.send(obj);
    }).catch(e => {resp.send(f.error(e)); console.log(e)});
});

app.get('/user/update', (req, resp) => {
    let p = req.query;
    console.log('GET /user/update ' + p);
    userManager.updateName(p.uid, p.name).then((obj) => {
        resp.send(obj);
    }).catch(e => {resp.send(f.error(e)); console.log(e)});
});

app.get('/card', (req, resp) => {
    let p = req.query;
    console.log('GET /card ' + p);
    cardManager.find(p.uid, p.card).then((obj) => {
        resp.send(obj);
    }).catch(e => {resp.send(f.error(e)); console.log(e)});
});

app.get('/card/summon', (req, resp) => {
    let p = req.query;
    console.log('GET /card/summon ' + p);
    cardManager.summon(p.uid, p.card).then((obj) => {
        resp.send(obj);
    }).catch(e => {resp.send(f.error(e)); console.log(e)});
});

app.get('/card/diff', (req, resp) => {
    let p = req.query;
    console.log('GET /card/diff ' + p);
    cardManager.difference(p.uid, p.toid).then((obj) => {
        resp.send(obj);
    }).catch(e => {resp.send(f.error(e)); console.log(e)});
});

app.get('/card/sell', (req, resp) => {
    let p = req.query;
    console.log('GET /card/sell ' + p);
    cardManager.sell(p.uid, p.card).then((obj) => {
        resp.send(obj);
    }).catch(e => {resp.send(f.error(e)); console.log(e)});
});

app.get('/card/send', (req, resp) => {
    let p = req.query;
    console.log('GET /card/send ' + p);
    cardManager.transfer(p.uid, p.toid, p.card).then((obj) => {
        resp.send(obj);
    }).catch(e => {resp.send(f.error(e)); console.log(e)});
});

app.get('/lead', (req, resp) => {
    let p = req.query;
    console.log('GET /lead ' + p);
    leadManager.getLeaders(p.uid).then((obj) => {
        resp.send(obj);
    }).catch(e => {resp.send(f.error(e)); console.log(e)});
});*/
