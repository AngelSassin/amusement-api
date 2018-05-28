module.exports = {
    isInt,
    getRegexString,
    parseToSeconds,
    msToTime,
    HEXToVBColor,
    getSourceFormat,
    toTitleCase,
    getMinutesDifference,
    getHoursDifference,
    getFullTimeDifference,
    getCardFile,
    getCardURL,
    containsCard,
    cardsMatch,
    getBestCardSorted,
    getRandomCard,
    countCardLevels,
    getRequestFromFilters,
    getRequestFromFiltersNoPrefix,
    getRequestFromFiltersWithPrefix,
}

const collections = require("../routes/collections");
const config = require("../settings/conf");
const _ = require('lodash');
const lev = require('js-levenshtein');

function getSourceFormat(str) {
    return str.replace(' ', '');
}

function getRegexString(arr) {
    var ln = _formatSymbols(arr[0]);
    for(var j=1; j<arr.length; j++) {
        ln += '.*' + _formatSymbols(arr[j]);
    }
    return ln;
}

function _formatSymbols(word) {
    return word 
        .replace('.', '\\.')
        .replace('?', '\\?')
        .replace('_', ' ');
}

function HEXToVBColor(rrggbb) {
    var bbggrr = rrggbb.substr(4, 2) + rrggbb.substr(2, 2) + rrggbb.substr(0, 2);
    return parseInt(bbggrr, 16);
}

function parseToSeconds(inp) {
    var c = inp.split(':');
    return parseInt(c[0]) * 3600 
    + parseInt(c[1]) * 60
    + parseFloat(c[2]);
}

function toTitleCase(str) {
    return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
}

function msToTime(s) {

    function pad(n, z) {
      z = z || 2;
      return ('00' + n).slice(-z);
    }

    var ms = s % 1000;
    s = (s - ms) / 1000;
    var secs = s % 60;
    s = (s - secs) / 60;
    var mins = s % 60;
    var hrs = (s - mins) / 60;

    return pad(hrs) + ':' + pad(mins) + ':' + pad(secs) + '.' + pad(ms, 3);
}

function getHoursDifference(tg) {
    let mil = new Date() - tg;
    return Math.floor(mil / (1000*60*60));
}

function getMinutesDifference(tg) {
    let mil = new Date() - tg;
    return Math.floor(mil / (1000*60));
}

function getFullTimeDifference(tg) {
    let mil = new Date() - tg;
    return msToTime(mil);
}

function getCardFile(card) {
    let ext = card.animated? '.gif' : (card.compressed? '.jpg' : '.png');
    let prefix = card.craft? card.level + 'cr' : card.level;
    let col = collections.filter(c => c.includes(card.collection))[0];
    return './cards/' + col + '/' + prefix + "_" + card.name + ext;
}

function getCardURL(card) {
    // if(card.animated && card.imgur) 
    //     return "https://i.imgur.com/" + card.imgur + ".gifv";

    let ext = card.animated? '.gif' : '.png';
    let prefix = card.craft? card.level + 'cr' : card.level;
    let col = collections.getByID(card.collection);
    if(!col) return "";

    let path = col.special? '/promo/' : '/cards/';
    if(!card.animated && col.compressed) ext = '.jpg';

    return "https://amusementclub.nyc3.digitaloceanspaces.com" 
        + path + col.id + '/' + prefix + "_" + card.name.toLowerCase() + ext;
}

function containsCard(array, card) {
    return array.filter(c => cardsMatch(c, card))[0];
}

function cardsMatch(card1, card2) {
    return (card1.name.toLowerCase() === card2.name.toLowerCase() && 
            card1.collection === card2.collection && 
            card1.level === card2.level);
}

function getRequestFromFiltersWithPrefix(args, prefix) {
    prefix = prefix || "";
    let query = {};
    let keywords = [];
    let levelInclude = [];
    let levelExclude = [];
    let collectionInclude = [];
    let collectionExclude = [];

    if(!args || args.length == 0) return {};
    if(!Array.isArray(args)) args = [args];
    args.forEach(element => {
        element = element.trim();
        if(isInt(element) && parseInt(element) <= 5 && parseInt(element) > 0)
            levelInclude.push(parseInt(element));

        else if(element[0] == '-') {
            let el = element.substr(1);
            if(el === "craft") query[prefix + 'craft'] = true; 
            else if(el === "multi") query[prefix + 'amount'] = {$gte: 2};
            else if(el === "gif") query[prefix + 'animated'] = true;
            else if(el === "fav") query[prefix + 'fav'] = true;
            else if(el === "frozen") {
                var yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                query[prefix + 'frozen'] = {$gte: yesterday};
            }
            else {
                col = collections.parseCollection(el);
                col.map(c => collectionInclude.push(c.id));
            }
        }
        else if(element[0] == '!') {
            let el = element.substr(1);
            if(isInt(el) && parseInt(el) <= 5 && parseInt(el) > 0)
                levelExclude.push(parseInt(el));
            if(el === "craft") query[prefix + 'craft'] = false; 
            else if(el === "multi") query[prefix + 'amount'] = {$eq: 1};
            else if(el === "gif") query[prefix + 'animated'] = false;
            else if(el === "fav") query[prefix + 'fav'] = {$in: [null, false]};
            else if(el === "frozen") {
                var yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                query[prefix + 'frozen'] = {$lte: yesterday};
            }
            else {
                col = collections.parseCollection(el);
                col.map(c => collectionExclude.push(c.id));
            }

        } else keywords.push(element.trim());
    }, this);
    if(levelExclude.length > 0 || levelInclude.length > 0) {
        query[prefix + 'level'] = {};
        if(levelExclude.length > 0) {
            query[prefix + 'level'].$nin = levelExclude;
        }
        if(levelInclude.length > 0) {
            query[prefix + 'level'].$in = levelInclude;
        }
    }
    
    if(collectionExclude.length > 0 || collectionInclude.length > 0) {
        query[prefix + 'collection'] = {};
        if(collectionExclude.length > 0) {
            query[prefix + 'collection'].$nin = collectionExclude;
        }
        if(collectionInclude.length > 0) {
            query[prefix + 'collection'].$in = collectionInclude;
        }
    }

    if(keywords.length > 0) {
        let keywordString = keywords.join('_').replace(/\\/g, '');
        query[prefix + 'name'] = new RegExp("(_|^)" + keywordString, 'ig');
    } 

    return query;
}

function getRequestFromFilters(args) {
    return getRequestFromFiltersWithPrefix(args, "cards.");
}

function getRequestFromFiltersNoPrefix(args) {
    return getRequestFromFiltersWithPrefix(args, "");
}

function getBestCardSorted(cards, n) {
    if(cards.length == 0) return [];
    
    let name;
    if(n instanceof RegExp) 
        name = n.toString().split('/')[1].replace('(_|^)', '').replace(/\?/g, '');
    else name = n.replace(' ', '_');

    let filtered = cards.filter(c => c.name.toLowerCase().includes(name));
    filtered.sort((a, b) => {
        let dist1 = lev(a.name, name);
        let dist2 = lev(b.name, name);
        if(dist1 < dist2) return -1;
        if(dist1 > dist2) return 1;
        else return 0;
    });

    if(filtered.length > 0) {
        name = name.replace(/\\/g, '');
        var re = new RegExp('^' + name);
        let supermatch = filtered.filter(c => re.exec(c.name.toLowerCase()));
        if(supermatch.length > 0) { 
            let left = filtered.filter(c => !supermatch.includes(c));
            return supermatch.concat(left);
        }
    }
    return filtered;
}

function getRandomCard(cards) {
    return cards[Math.floor(Math.random()*cards.length)];
}

function countCardLevels(cards) {
    let sum = 0;
    let metCards = [];
    if(!cards) return 0;
    cards.forEach(function(element) {
        if(!metCards.includes(element.name)) {
            sum += element.level;
            metCards.push(element.name);
        }
    }, this);
    return sum;
}

function isInt(value) {
    return !isNaN(value) && 
        parseInt(Number(value)) == value && 
        !isNaN(parseInt(value, 10));
}