const config = {
"collectCoverage": true,
	"collectCoverageFrom": ["./src/**"],
	coverageReporters: [
		'text',
		'text-summary',
		'lcov', 
	],
	"coverageThreshold": {
		"global": {
			"lines": 50
		}
	}
}


module.exports = config;