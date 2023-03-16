# simple-mailgun.js
[![CI](https://github.com/razorUX/SimpleMailgun.js/actions/workflows/test.yml/badge.svg)](https://github.com/razorUX/SimpleMailgun.js/actions/workflows/test.yml)
[![codecov](https://github.com/razorUX/simple-mailgun.js/raw/master/badge.svg?raw=true)](https://github.com/razorUX/SimpleMailgun.js)
[![npm version](https://badge.fury.io/js/simple-mailgun.js.svg)](https://badge.fury.io/js/simple-mailgun.js)

https://www.npmjs.com/package/simple-mailgun.js

A simple, tiny Mailgun client for Node.js.

* 🐤 Tiny wrapper around the Mailgun API
* ⚙️ Auto-config from environment variables
* 💬 Optional debug logging
* 🔁 Retry on HTTP 429 with [truncated exponential backoff](https://en.wikipedia.org/wiki/Exponential_backoff)
* 🤖 Includes CI with GitHub Actions
* ✅ 100% test coverage

> 💡 Currently **only** supports sending emails, will add more features as needed)

## Installation

```
npm i simple-mailgun.js
```

## Usage

### Creating the client

You can get an API key by following the [official docs](https://documentation.mailgun.com/en/latest/api-intro.html#authentication-1).

```javascript
const { createMailgunClient } = require('simple-mailgun.js');

const client = createMailgunClient({
  domain: "mail.example.com",
  apiKey: "FAKE_API_KEY",
		
  debugLogging: true // Optional, default to false
});
```

> Note: You can also set the `MAILGUN_DOMAIN` and `MAILGUN_API_KEY` environment variables, and they'll be picked up automatically.

```javascript
process.env.MAILGUN_DOMAIN = "mail.example.com";
process.env.MAILGUN_API_KEY = "API KEY";

const client = createMailgunClient(); // No args necessary
```

### Sending emails

```javascript
const response = await client.sendMessage({
	from: "alice@example.com",
	to: "bob@example.com",
	subject: "Testing",
	text: "Hello from SimpleMailgun.js"
});
// # => { "id": "<20230315132348.b667e195e4fa57fc@mail.gametime.events>", "message": "Queued. Thank you." }
```

You can put whatever params you want into the options object.
The params will be serialized into a `FormData` and sent to Mailgun's API.
The full of options you can send is [here](https://documentation.mailgun.com/en/latest/api-sending.html#sending).

## Development

Run tests:
```
npm run test
```
> Runs Jest in watch mode

Publish new version to NPM:

```
npm run publish
```

## Why _another_ Mailgun client?

Mailgun has two existing Node.js SDKs ([official SDK](https://github.com/mailgun/mailgun.js), [legacy SDK](https://github.com/mailgun/mailgun-js-boland)).

Both are too bloody complicated and give me inscrutable errors.
I just want to send emails.

This library does what I need in 87 lines, and now I can get on with my life.

`</rant>`


## Thank You

Development sponsored by [razorUX](razorux.com)