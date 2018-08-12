const userModule = require('./user');
const f = require("../modules/formatter");
const utils = require("../modules/utils");
const collections = require("../modules/collections");
const stats = require("../modules/stats");

var mongodb, ucollection, ccollection;

function connect(connection) {
    mongodb = connection;
    ucollection = mongodb.collection('users');
    ccollection = mongodb.collection('cards');
}

function getIndex() {
    return new Promise((fulfill, reject) => {
        stats.general().then(stat => {
            ccollection.aggregate([
                {"$match": {"level": 3}},
                {"$sample" : {"size": 1}}
            ]).toArray((err, cards) => {
                if(err) return reject(err);

                let card = cards[0];
                let col = collections.getByID(card.collection);
                card.url = utils.getCardURL(card);
                card.name = utils.getCardName(card);
                card.collection = col? col.name : card.collection;
                fulfill(f.respPass({card: cards[0], stats: stat}));
            });
        });
    });
}

module.exports = {
    connect, getIndex
}
