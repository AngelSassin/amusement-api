module.exports = {
	getQuests
}

const userModule = require('./user');

function getQuests(discordID) {
	return new Promise((fulfill, reject) => {
	    userModule.getUser(discordID).then(dbUser => {
	    	fulfill(user.quests? user.quests : []);
	    }).catch(e => reject(e));
	});
}