module.exports = {
    connect
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

