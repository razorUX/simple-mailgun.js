// # Native imports

// # Package imports

require('dotenv').config()
 
require('isomorphic-fetch');

const { createErrorType, stringToBase64, retry, MILLISECONDS } = require('razorux-js-utils');

// # Local imports

// # Constants

const RETRY_CONFIG = {
	backoff: true,
 	jitter: true,
 	maxRetryDelay: 3 * MILLISECONDS.ONE_MINUTE, // No retry delay of longer than 3m
 	timeout: 10 * MILLISECONDS.ONE_MINUTE,
	debugLogging: true,
	onError(error) {
		console.error(error);
		if(error.name == "HTTPTooManyRequestsError") return false;
		return true;
	}
}

// # Custom errors

const MailgunAPIError = createErrorType('MailgunAPIError');
const HTTPResponseNotOKError = createErrorType('HTTPResponseNotOKError');
const HTTPTooManyRequestsError = createErrorType('HTTPTooManyRequestsError');

// # Runtime config

// # Main

function createMailgunClient(options) {
	
	const domain = options?.domain || process.env.MAILGUN_DOMAIN;
	const username = "api";
	const apiKey = options?.apiKey || process.env.MAILGUN_API_KEY;
	 
	_assertTruthy(domain, `Missing Mailgun domain. Set options.domain or the MAILGUN_DOMAIN environment variable. (Got: ${ domain })`);
	_assertTruthy(apiKey, `Missing Mailgun API key. Set options.apiKey or the MAILGUN_API_KEY environment variable. (Got: ${ apiKey })`);
	
	const debugLogging = options?.debugLogging || false;
	
	return {
		async sendMessage(params) {
			this._assertTruthy(params, `Missing required parameter "params" (Got: ${params})`)
			return this._networkRequest("/messages", params);
		},

		async _networkRequest(pathname, params) {
			const url = this._baseUrl() + pathname;
		 const request = this._assembleRequest(params);

		 this._log("_networkRequest");
		 this._log(url);
		 this._log(request);

		 try {
			 const json = await retry(() => this._fetch(url, request), RETRY_CONFIG);
			 console.log(`After retry`);
			 return json;
		 } catch(error) {
			 throw new MailgunAPIError({
				 message: error.message,
				 error
			 })
		 }
		},
		
		async _fetch(url, request) {
			const response = await fetch(url, request);
			if(response.status == 429) throw new HTTPTooManyRequestsError({ message: "Got HTTP Error 429: Too many requests. Please try again later."})
			if(!response.ok) throw new HTTPResponseNotOKError({ message: `Got non-OK HTTP response ${response.status}` });
			return response.json();
		},

		_assembleRequest(params) {
			const formData = this._objectToFormData(params);
			return {
				method: params.method || "post",
				body: formData,
				headers: {
					...this._authHeaders(),
				}
			}
		},

		_objectToFormData(obj) {
			const formData = new FormData();
			Object.entries(obj).forEach(([k, v]) => {
				formData.append(k, v);
			});
			return formData;
		},

		_baseUrl() {
			return `https://api.mailgun.net/v3/${this._domain()}`;
		},

		_authHeaders() {
			const { username, apiKey } = this._credentials();
			const basicAuthString = stringToBase64(`${username}:${apiKey}`)
			return {
				"Authorization" : `Basic ${basicAuthString}`
			};
		},

		_domain() {
			return domain;
		},

		_credentials() {
			return {
			 username,
			 apiKey
			}
		},
		
		_log(str) {
			if(debugLogging) console.log(str);
		},
		
		_assertTruthy,
	}
}

function _assertTruthy(arg, msg) {
	if(!arg) throw new TypeError(msg);
}

// # Helper functions

// # Exports

exports.createMailgunClient = createMailgunClient;