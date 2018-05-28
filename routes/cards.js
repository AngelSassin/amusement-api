module.exports = {
    connect, difference, summon, transfer, sell, addCardToUser
}

const userModule = require('./user');
const f = require("../modules/formatter");
const utils = require("../modules/utils");

var mongodb, ucollection, ccollection;

function connect(connection) {
    mongodb = connection;
    ucollection = mongodb.collection('users');
    ccollection = mongodb.collection('cards');
}

function getUserCards(userID, query) {
    return ucollection.aggregate([
        {"$match":{"discord_id":userID}},
        {"$unwind":"$cards"},
        {"$match":query},
        {"$group": {
            _id: {
                discord_id: "$discord_id", 
                username: "$username", 
                dailystats: "$dailystats",
                exp: "$exp",
                quests: "$quests",
                gets: "$gets",
                sends: "$sends"
            }, 
            cards: {"$push": "$cards"}}
        }
    ]);
}

function addCardToUser(usercards, card) {
    var usercard = utils.containsCard(usercards, card);
    if(usercard) usercard.amount = (usercard.amount? usercard.amount + 1 : 2);
    else {
        card.amount = 1;
        usercards.push(card);
    }
    return usercards;
}

function difference(discordID1, discordID2, filters) {
    return new Promise((fulfill, reject) => {
        userModule.getUser(discordID1).then(dbUser1 => {
            if(!dbUser1.cards) {fulfill(f.respFail('CARD_NONE')); return; }
            if(discordID1 == discordID2) {
                fulfill(f.respFail('ID_MATCH')); 
                return; 
            }
            userModule.getUser(discordID2).then(dbUser2 => {
                if(!dbUser2.cards) {fulfill(f.respFail('CARD_NONE2')); return; }
                let dif = dbUser2.cards.filter(x => dbUser1.cards.filter(y => x.name == y.name) == 0);
                let cards = [];
                dif.forEach(element => {
                    cards.push(element);
                }, this);
                
                if(cards.length > 0) 
                    fulfill(f.respPass(cards));
                else fulfill(f.respFail('CARD_NOMATCH'));
            });
        }).catch(e => reject(e));
    });
}

function summon(discordID, args) {
    return new Promise(async (fulfill, reject) => {
        let query = utils.getRequestFromFilters(args);
        
        let objs = await (await getUserCards(discordID, query)).toArray();
        if(!objs[0]) return fulfill(f.respFail('CARD_NOMATCH'));
        
        let cards = objs[0].cards;
        let dbUser = objs[0]._id;
        let match = query['cards.name']? utils.getBestCardSorted(cards, query['cards.name']) : utils.getRandomCard(cards);
        if(!match) return fulfill(f.respFail('CARD_NOMATCH'));
        match.imageURL = utils.getCardURL(match);

        let stat = dbUser.dailystats;
        if(!stat) stat = {summon:0, send: 0, claim: 0, quests: 0};
        stat.summon++;

        //heroes.addXP(dbUser, .1);
        await ucollection.update({ discord_id: dbUser.id }, {$set: {dailystats: stat}});
        fulfill(f.respPass(match));
        //quest.checkSummon(dbUser, (mes)=>{callback(mes)});
    });
}

function transfer(fromID, toID, cardName) {
    return new Promise((fulfill, reject) => {
        userModule.getUser(fromID).then(dbUserFrom => {
            if(!dbUserFrom.cards) {fulfill(f.respFail('CARD_NONE')); return; }
            if(fromID == toID) {fulfill(f.respFail('ID_MATCH')); return;}

            let check = cardName.toLowerCase().replace(/ /g, "_");
            let match = utils.getBestCardSorted(dbUserFrom.cards, check)[0];
            if(match){
                let name = utils.toTitleCase(match.name.replace(/_/g, " "));
                let hours = 20 - utils.getHoursDifference(match.frozen);
                if(hours && hours > 0) {
                    /*callback("**" + from.username + "**, the card **" 
                        + name + "** is frozen for **" 
                        + hours + "** more hours! You can't transfer it");*/
                    fulfill(f.respFail('CARD_FROZEN'));
                    return;
                }

                userModule.getUser(toID).then(dbUserTo => {
                    let cards = dbUserFrom.cards;
                    let stat = dbUserFrom.dailystats;
                    let i = cards.indexOf(match);
                    cards.splice(i, 1);

                    if(!stat) stat = {summon: 0, send: 0, claim: 0};
                    stat.send++;

                    var fromExp = dbUserFrom.exp;
                    //fromExp = heroes.getHeroEffect(dbUserFrom, 'send', fromExp, match.level);
                    /*if(fromExp > dbUser.exp) 
                        callback("**Akari** grants **" + Math.round(fromExp - dbUser.exp) 
                            + "** tomatoes to **" + dbUser.username 
                            + "** for sending a card!");*/

                    //heroes.addXP(dbUserFrom, .1);
                    ucollection.update(
                        { discord_id: fromID }, 
                        { $set: {cards: cards, dailystats: stat, exp: fromExp}}
                    ).then(() => {
                        //quest.checkSend(dbUserFrom, match.level, (mes)=>{callback(mes)});
                    });

                    match.frozen = new Date();
                    ucollection.update(
                        { discord_id: toID },
                        { $push: {cards: match }}
                    ).then(() => {
                        //forge.getCardEffect(dbUserFrom, 'send', u2, callback);
                    });

                    fulfill(f.respPass([match, dbUserTo.username]));
                }).catch(e => reject(e));
            } else fulfill(f.respFail('CARD_NOMATCH'));
        }).catch(e => reject(e));
    });
}

function sell(discordID, cardName) {
    return new Promise((fulfill, reject) => {
        userModule.getUser(discordID).then(dbUser => {
            let check = cardName.toLowerCase().replace(/ /g, "_");
            let cards = dbUser.cards;
            if(!cards){ fulfill(f.respFail('CARD_NONE')); return; }

            let match = utils.getBestCardSorted(dbUser.cards, check)[0];
            if(match) {
                //heroes.addXP(dbUser, .1);
                //let exp = forge.getCardEffect(dbUser, 'sell', settings.cardprice[match.level - 1])[0];
                let exp = 100;
                cards.splice(cards.indexOf(match), 1);
                ucollection.update(
                    { discord_id: discordID }, {
                        $set: {cards: cards},
                        $inc: {exp: exp}
                });

                fulfill(f.respPass(match));
            } else fulfill(f.respFail('CARD_NOMATCH'));
        }).catch(e => reject(e));
    });
}