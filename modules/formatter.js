module.exports = {user, respPass, respFail, error}

function user(username, message) {
	return "**" + username + "**, " + message;
}

function respPass(obj) {
	return { status: "OK", content: {status: "PASS", object: obj}};
}

function respFail(code) {
	return { status: "OK", content: {status: "FAIL", code: code}};
}

function error(err) {
	return { status: "ERR", message: err.message, stack: err.stack};
}
