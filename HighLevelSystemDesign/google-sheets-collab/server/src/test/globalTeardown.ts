export = async function globalTeardown() {
	const instance: any = (global as any).__MONGOINSTANCE;
	await instance.stop();
};
