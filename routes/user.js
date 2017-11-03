module.exports = {
    connect, getUser, claim, pay, findCard, daily, award, getUserApi, balance, whohas
}

const constants = require("../settings/const");
const config = require("../settings/conf");
const guilds = require('../settings/guilds');

const f = require("../modules/formatter");
const utils = require("../modules/utils");

const _ = require('lodash');
var mongodb, ucollection, ccollection;

function connect(connection) {
    mongodb = connection;
    ucollection = mongodb.collection('users');
    ccollection = mongodb.collection('cards');
}

function getUser(discordID) {
    return new Promise((fulfill, reject) => {
        if(!discordID) reject({ message: "Invalid user ID"});

        ucollection.findOne({discord_id: discordID}).then(user => {
            if(!user) {
                ucollection.update({ discord_id: discordID },
                    { $set: { 
                        discord_id: discordID,
                        username: "",
                        exp: 300
                    }}, { upsert: true }
                ).then(u => { fulfill(user); });
            } else fulfill(user);
        }).catch(err => reject(err));
    });
}

function updateName(discordID, newName) {
    return new Promise((fulfill, reject) => {
        getUser(discordID).then(dbUser => {
            ucollection.update({ discord_id: discordID },
                { $set: { username: newName }})
            .then(u => { fulfill(f.respPass(dbUser)); });
        }).catch(err => reject(err));
    });
}

function getUserApi(discordID) {
    return new Promise((fulfill, reject) => {
        getUser(discordID).then(dbUser => {
            fulfill(f.respPass(dbUser));
        }).catch(err => reject(err));
    });
}

function pay(fromID, toID, amount) {
    return getUser(fromID).then(dbUserFrom => {
        return new Promise((fulfill, reject) => {
            if(!utils.isInt(amount))
                return fulfill(f.respFail('NAN'));

            amount = Math.abs(amount);
            if(dbUserFrom.exp >= amount) {
                return getUser(toID).then(dbUserTo => {
                    ucollection.update({ discord_id: fromID }, {$inc: {exp: -amount }});
                    ucollection.update({ discord_id: toID }, {$inc: {exp: amount }});
                    fulfill(f.respPass({amount:amount, userTo:dbUserTo.username}));
                });
            } else fulfill(f.respFail('TOMATO_NONE'));
        });
    });
}

function getCards(discordID, filters) {
    return new Promise((fulfill, reject) => {
        getUser(discordID).then(dbUser => {
            if(!dbUser.cards) { fulfill(f.respFail('CARD_NONE')); return; }
            fulfill(f.respPass(dbUser.cards));
        }).catch(e => reject(e));
    });
}

function findCard(discordID, cardName) {
    return getUser(discordID).then(dbUser => {
        return new Promise((fulfill, reject) => {
            if(!dbUser.cards) { fulfill(f.respFail('CARD_NONE')); return; }

            let check = cardName.toLowerCase().replace(/ /g, "_");
            let match = utils.getBestCardSorted(dbUser.cards, check)[0];
            if(match) fulfill(f.respPass(match));
            else fulfill(f.respFail('CARD_NOMATCH'));
        });
    });
}

function balance(discordID) {
    return getUser(discordID).then(dbUser => {
        return new Promise((fulfill, reject) => {
            var obj = {
                bal: Math.round(dbUser.exp),
                stars: utils.countCardLevels(dbUser.cards),
                promo: Math.round(dbUser.promoexp),
                nextClaim: dbUser.dailystats? 
                    (dbUser.dailystats.claim + 1) * constants.claim_incr : constants.claim_incr 
            }
            fulfill(f.respPass(obj));
        });
    });
}

function daily(discordID) {
    return new Promise((fulfill, reject) => {
        getUser(discordID).then(dbUser => {
            let stars = utils.countCardLevels(dbUser.cards);
            let hours = 20 - utils.getHoursDifference(dbUser.lastdaily);
            let resp = {
                stars: stars,
                bal: Math.round(dbUser.exp),
                newPlayer: stars < 35,
                needsHero: !dbUser.hero && stars >= 50,
                amount: 100, minutes: 0, hours: 0
            }
            
            //if(dbUser.dailystats && dbUser.dailystats.claim) 
                //amount = Math.max(heroes.getHeroEffect(dbUser, 'daily', dbUser.dailystats.claim), 100);

            //let cardEffect = forge.getCardEffect(dbUser, 'daily', amount, 20);
            //amount = cardEffect[0];
            
            if(resp.newPlayer) resp.amount += 200;
            //heroes.addXP(dbUser, 1);
            //let hours = cardEffect[1] - utils.getHoursDifference(dbUser.lastdaily);
            resp.bal += resp.amount;
            if(!hours || hours <= 0) {
                ucollection.update(
                    { discord_id: discordID }, {
                    $set: {lastdaily: new Date()/*, quests: quest.getRandomQuests()*/},
                    $unset: {dailystats: ""},
                    $inc: {exp: resp.amount}
                }).catch(e => reject(e));
            } else {
                resp.amount = 0;
                resp.minutes = 60 - (utils.getMinutesDifference(dbUser.lastdaily) % 60);
                resp.hours = hours;
            }
            fulfill(f.respPass(resp));
        }).catch(e => reject(e));
    });
}

//TODO MAKE ADMIN VALIDATION!!!
function award(discordID, amount) {
    return getUser(discordID).then(dbUser => {
        return new Promise((fulfill, reject) => {
            console.log(amount);
            if(!utils.isInt(amount))
                return fulfill(f.respFail('NAN'));

            intAmount = parseInt(amount);
            ucollection.update(
                { discord_id: discordID },
                { $inc: {exp: intAmount}}
            ).then(() => {
                fulfill(f.respPass({amount:amount, userTo:dbUser.username}));
            });
        });
    });
}

function whohas(discordID, cardName) {
    return getUser(discordID).then(dbUser => {
        return new Promise((fulfill, reject) => {
            ccollection.find({}).toArray((err, cards) => {
                if(err) return reject(err);

                let match = utils.getBestCardSorted(cards, cardName)[0];
                if(!match) return fulfill(f.respFail('CARD_NOMATCH'));

                ucollection.find(
                    {"cards":{"$elemMatch":{"name":match.name}}}
                ).toArray((err, arr) => {
                    if(err) return reject(err);
                    let users = [];
                    let userIDs = [];
                    for (var i = 0; i < arr.length; i++) {
                        users.push(arr[i].username);
                        userIDs.push(arr[i].discord_id);
                    }
                    fulfill(f.respPass({card:match, users:users, ids:userIDs}));
                });
            });   
        });
    });
}

function claim(discordID, amount) {
    //return new Promise((fulfill, reject) => {
    return getUser(discordID).then(dbUser => {
        return new Promise((fulfill, reject) => {
            let stat = dbUser.dailystats;
            let claimCost = (stat.claim + 1) * constants.claim_incr;
            if(!stat) stat = {summon:0, send: 0, claim: 0, quests: 0};
            let resp = {
                claimCost: claimCost,
                nextClaim: claimCost + constants.claim_incr,
                bal: Math.round(dbUser.exp),
                newCard: true
            }

            //claimCost = heroes.getHeroEffect(dbUser, 'claim_akari', claimCost);
            if(dbUser.exp < resp.claimCost) return fulfill(f.respFail('TOMATO_NONE'));

            let blockClaim = dbUser.dailystats && dbUser.dailystats.claim >= 30;
            if(blockClaim) return fulfill(f.respFail('CLAIM_CAP'));

            //let guild = guilds.filter(g => g.guild_id == guildID)[0];
            let find = {};
            //if(guild && !any) find.collection = guild.collection;
            //find = forge.getCardEffect(dbUser, 'claim', find)[0];

            ccollection.find(find).toArray((err, data) => {
                let card = _.sample(data);
                resp.card = card;

                //let heroEffect = !heroes.getHeroEffect(dbUser, 'claim', true);
                //nextClaim = heroes.getHeroEffect(dbUser, 'claim_akari', nextClaim);

                resp.newCard = (dbUser.cards 
                    && dbUser.cards.filter(c => c.name == card.name && c.collection == card.collection).length > 0)

                stat.claim++;
                //heroes.addXP(dbUser, .1);
                return ucollection.update(
                    { discord_id: dbUser.discord_id }, {
                        $push: {cards: card },
                        $set: {dailystats: stat},
                        $inc: {exp: -claimCost}
                }).then(() => {
                    fulfill(f.respPass(resp));
                    //quest.checkClaim(dbUser, (mes)=>{callback(mes)});
                });
            });
        });
    });
}
