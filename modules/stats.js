const utils = require("./utils");
const collections = require("./collections");

var mongodb, ucollection, ccollection;

function connect(connection) {
    mongodb = connection;
    ucollection = mongodb.collection('users');
    ccollection = mongodb.collection('cards');
    pcollection = mongodb.collection('promocards');
}

function general() {
    return new Promise((fulfill, reject) => {
        let promises = [];
        let stats = {};
        let date = new Date();
        let lastWeek = new Date(date.setDate(date.getDate() - 7));

        promises.push(ccollection.count());
        promises.push(pcollection.count());
        promises.push(ucollection.count({lastdaily: {$gt: lastWeek}}));
        promises.push(ucollection.count({'cards.1': {$exists: true}}));
        Promise.all(promises).then(v => {
            stats.servers = 1200;
            stats.cards = v[0] + v[1];
            stats.fandoms = collections.count(c => !c.promo);
            stats.weekly = v[2];
            stats.players = v[3];

            fulfill(stats);
        });
    });
}

module.exports = {
    connect, general
}
