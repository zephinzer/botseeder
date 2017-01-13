/**
 * Import dependencies.
 */
const http = require('http');
const MessengerBot = require('messenger-bot');
const superagent = require('superagent');

const CONFIG = require('./config.json');

/**
 * Set up an instance of our bot.
 */
const bot = new MessengerBot({
	token: CONFIG.FACEBOOK_PAGE_TOKEN,
	verify: CONFIG.FACEBOOK_VERIFY_TOKEN,
	secret: CONFIG.FACEBOOK_APP_SECRET
});

/**
 * Generic error handling function, pass in :errorInstance and it will print in 
 * your Terminal.
 * 
 * @param {any} errorInstance
 * @returns {Number|<errorInstance>} corresponding to error code
 */
function displayError(errorInstance) {
	console.error('|-----------------------> ERROR-----------------------|');
	console.error(errorInstance);
	console.error('|-----------------------! ERROR-----------------------|');
	return errorInstance.code || errorInstance.errno || errorInstance;
}

/**
 * Generic message display function, pass in the relevant message and get it printed
 * in the Terminal.
 * 
 * @param {any} message to print 
 * @returns {Number} always 0
 */
function displayMessage(message) {
	console.error('|-----------------------> MESSAGE---------------------|');
	console.error(message);
	console.error('|-----------------------! MESSAGE---------------------|');
	return 0;
}

/**
 * This gets called when an error happens. We log it to the console.
 */
bot.on('error', function(err) {
	displayError(err);
});

/**
 * This gets called when a message comes through from Facebook. We 
 * send an API call to API.AI via `superagent` and send the response 
 * back to the user.
 */
bot.on('message', function(payload, reply) {
	/// fastidiously load required variables
	const query = payload.message.text;
	const senderId = payload.sender.id;

	bot.getProfile(senderId, function(error, profile) {
		if(error) {
			/// show the error and exit from this function
			return displayError(error);
		} else {
			/// show the user's profile on our console
			displayMessage(profile);
		}

		/// prepare variables for call to API.AI
		const lang = 'en';
		const sessionId = senderId;
		const postAddress = `${CONFIG.APIAI_API_URL}/query`;
		const authorization = `Bearer ${CONFIG.APIAI_CLIENT_TOKEN}`;
		const contentType = 'application/json; charset=utf-8';
		const version = { v: '20150910' };
		const postData = { query, lang, sessionId };

		/// actually call API.AI
		superagent.post(postAddress)
			.set('Authorization', authorization)
			.set('Content-Type', contentType)
			.query(version)
			.send(postData)
			.end((err, apiAiResponse) => {
				/// parse response from API.AI
				const result = apiAiResponse.body.result;
				const ourResponse = {
					text: result.fulfillment.speech
				};

				/// send human response to user
				reply(ourResponse, (err) => {
					return displayError(err);
				});
			});
	});
});

http.createServer(bot.middleware()).listen(process.env.PORT || 11807);
console.info('Facebook/API.AI bot is running on port 11807');