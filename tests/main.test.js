require('dotenv').config()

 var fm = require('fetch-mock');

const {
	createMailgunClient
} = require('../src/main')


const API_RESPONSES = {
	MESSAGE_SEND_SUCCESS: {
		status: 200,
		body: {
				"id": "<20230315132348.b667e195e4fa57fc@mail.gametime.events>",
				"message": "Queued. Thank you."
		}
	}
}

const MAILGUN_CONFIG = {
	domain: "mail.example.com",
	apiKey: "FAKE_API_KEY",
	debugLogging: true
}

const MESSAGE_PARAMS = {
	from: "alice@example.com",
	to: "bob@example.com",
	subject: "Testing",
	text: "Hello from SimpleMailgun.js"
}

async function captureError(fn) {
	try {
		await fn();	
	} catch(e) {
		return e
	}
}

describe('Test suite', () => {
	beforeEach(() => {
		fm.reset();
		fm.mock('https://api.mailgun.net/v3/mail.example.com/messages', API_RESPONSES.MESSAGE_SEND_SUCCESS);
	});
	
	describe('constructor', () => {
		test('should throw if no domain is configured', async () => {
			const error = await captureError(async () => {
				const client = createMailgunClient();
			})
			
			expect(error).toBeDefined();
			expect(error.name).toBe('TypeError');
			expect(error.message).toBe( "Missing Mailgun domain. Set options.domain or the MAILGUN_DOMAIN environment variable. (Got: undefined)");
		});
		
		
		test('should throw if no API key is configured', async () => {
			const error = await captureError(async () => {
				const client = createMailgunClient({
					domain: "xyz",
					username: "abc",
				});
			})
			
			expect(error).toBeDefined();
			expect(error.name).toBe('TypeError');
			expect(error.message).toBe( "Missing Mailgun API key. Set options.apiKey or the MAILGUN_API_KEY environment variable. (Got: undefined)");
		});
	});

	describe('send message', () => {
	  
		let client;
	
	  beforeEach(() => {
			client = createMailgunClient(MAILGUN_CONFIG);
		}) 
		
		test('should throw if params were not provided', async () => {
		  const error = await captureError(async () => {
				await client.sendMessage();
			})
			
			expect(error).toBeDefined();
			expect(error.name).toBe('TypeError');
			expect(error.message).toBe( "Missing required parameter \"params\" (Got: undefined)");
		});
	
		test('should send the right API call to the endpoint', async () => {
			const expected = API_RESPONSES.MESSAGE_SEND_SUCCESS.body;
			const actual = await client.sendMessage(MESSAGE_PARAMS);
			expect(actual).toStrictEqual(expected);
		});
		
		test('should throw if it gets a non-OK HTTP repsonse', async () => {
			fm.reset();
			fm.mock('https://api.mailgun.net/v3/mail.example.com/messages', {
				status: 500,
			});
			
			const error = await captureError(async () => {
				await client.sendMessage(MESSAGE_PARAMS);
			})
			
			expect(error).toBeDefined();
			expect(error.name).toBe('MailgunAPIError');
			expect(error.message).toBe( "Got non-OK HTTP response 500" );
		});
		
	});

	describe('network', () => {
	
		test('should retry on 429 errors', async () => {
			client = createMailgunClient(MAILGUN_CONFIG);
			
			fm.reset();
			let apiCallCount = 0;
			fm.mock('https://api.mailgun.net/v3/mail.example.com/messages', () => {
				apiCallCount += 1;
				if(apiCallCount < 3) return { status: 429 }
				return API_RESPONSES.MESSAGE_SEND_SUCCESS
			});
			
			await client.sendMessage(MESSAGE_PARAMS);
			
			expect(apiCallCount).toBe(3);
		});
		
	});


	describe('miscelaneous', () => {
	
		test('run without logging', async () => {
			client = createMailgunClient({
				domain: "mail.example.com",
				username: "api",
				apiKey: "FAKE_API_KEY",
			});
			
			await client.sendMessage(MESSAGE_PARAMS);
		});
		
		
		test('Should pick up env vars if they\'re set', async () => {
			process.env.MAILGUN_DOMAIN = "mail.another-example.com";
			process.env.MAILGUN_API_KEY = "A_DIFFERENT_API_KEY";
			
			fm.mock('https://api.mailgun.net/v3/mail.another-example.com/messages', API_RESPONSES.MESSAGE_SEND_SUCCESS);
			
			client = createMailgunClient();
			await client.sendMessage(MESSAGE_PARAMS);
			
			delete process.env.MAILGUN_DOMAIN;
			delete process.env.MAILGUN_API_KEY;
		});
	});
});
