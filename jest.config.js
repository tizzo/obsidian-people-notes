module.exports = {
	preset: 'ts-jest',
	testEnvironment: 'jsdom',
	roots: ['<rootDir>/src'],
	testMatch: [
		'**/__tests__/**/*.test.+(ts|tsx|js)',
		'**/*.(test|spec).+(ts|tsx|js)'
	],
	transform: {
		'^.+\\.(ts|tsx)$': 'ts-jest'
	},
	collectCoverageFrom: [
		'src/**/*.{ts,tsx}',
		'!src/**/*.d.ts',
		'!src/main.ts'
	],
	coverageDirectory: 'coverage',
	coverageReporters: ['text', 'lcov', 'html'],
	setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
	moduleNameMapping: {
		'^obsidian$': '<rootDir>/src/__tests__/__mocks__/obsidian'
	},
	testPathIgnorePatterns: [
		'<rootDir>/src/__tests__/__mocks__/',
		'<rootDir>/src/__tests__/setup.ts'
	]
};