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
    getBestCardSorted,
    countCardLevels
}

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
    let name = toTitleCase(card.name.replace(/_/g, " "));
    let ext = card.animated? '.gif' : (card.compressed? '.jpg' : '.png');
    let prefix = card.craft? card.level + 'cr' : card.level;
    return config.cards + card.collection + '/' + prefix + "_" + card.name + ext;
}

function getBestCardSorted(cards, name) {
    let filtered = cards.filter(c => _.includes(c.name.toLowerCase(), name));
    filtered.sort((a, b) => {
        let dist1 = lev(a, name);
        let dist2 = lev(b, name);
        if(dist1 < dist2) return 1;
        if(dist1 > dist2) return -1;
        else return 0;
    });

    var re = new RegExp('^' + name);
    let supermatch = filtered.filter(c => re.exec(c.name.toLowerCase()));
    if(supermatch.length > 0) { 
        let left = filtered.filter(c => !supermatch.includes(c));
        return supermatch.concat(left);
    }
    return filtered;
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