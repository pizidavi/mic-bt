declare const TestIdBrand: unique symbol;

export type TestId = string & { readonly [TestIdBrand]: 'TestId' };

/**
 * Branded test id for Maestro e2e selectors
 * @param id Test id in kebab-case, prefixed with the screen name (e.g. 'home-start-button')
 * @param args Optional additional arguments to append to the test id (e.g. 'home-start-button', 'primary')
 * @return Branded TestId
 */
export const testId = (id: string, ...args: string[]): TestId => (id + args.join('-')) as TestId;
