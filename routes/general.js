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
    scollection = mongodb.collection('system');
}

async function getIndex() {
    let stat = await stats.general();
    let card = await getDailyCard();
    let col = collections.getByID(card.collection);
    card.url = utils.getCardURL(card);
    card.name = utils.getCardName(card);
    card.collection = col? col.name : card.collection;
    return f.respPass({card: card, stats: stat});
}

async function getDailyCard() {
    let date = new Date();
    let lastDay = new Date(date.setDate(date.getDate() - 1));
    let dcard = await scollection.findOne({type: "dailycard"});

    if(!dcard){
        dcard = {
            type: "dailycard",
            timestamp: new Date(),
            card: await getRandomCard()
        } 
        await scollection.insert(dcard);

    } else if(dcard.timestamp < lastDay) {
        dcard.card = await getRandomCard();
        await scollection.update({type: "dailycard"}, {
            $set: {
                timestamp: new Date(),
                card: dcard.card
            }
        });
    }

    return dcard.card;
}

async function getRandomCard(argument) {
    return (await ccollection.aggregate([
        {"$match": {"level": 3}},
        {"$sample" : {"size": 1}}
    ]).toArray())[0];
}

module.exports = {
    connect, getIndex
}
