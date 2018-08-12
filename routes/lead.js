module.exports = {
    connect, getLeaders
}

const constants = require("../settings/const");
const config = require("../settings/conf");

const f = require("../modules/formatter");
const utils = require("../modules/utils");

const _ = require('lodash');
var mongodb, ucollection, ccollection;

function connect(connection) {
    mongodb = connection;
    ucollection = mongodb.collection('users');
    ccollection = mongodb.collection('cards');
}

function getLeaders(discordID, args) {
    //return getUser(discordID).then(dbUser => {
        return new Promise((fulfill, reject) => {
            //let global = arg == 'global';
            ucollection.aggregate([
                { $unwind : '$cards' },
                { $group: { _id: '$username', cards: { $addToSet: {
                    name: '$cards.name', 
                    level: '$cards.level', 
                    animated: '$cards.animated'}}}},
                { $unwind : '$cards' },
                { $project : { _id : '$_id', 
                    'cards': '$cards', 
                    'animated' : { $cond : [ "$cards.animated", 1, 0 ]}}},
                { $group : { _id : '$_id', 
                    'levels' : { $sum : '$cards.level' }, 
                    'animated' : {$sum : '$animated'}}}, 
                { $sort : { 'levels': -1 } }
            ]).toArray((err, users) => {
                if(err) return reject({ message: "Error processing request"});
                fulfill(f.respPass(users));
            });
        });
    //});
}
