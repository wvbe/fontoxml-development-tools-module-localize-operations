module.exports = fotno => {
	[
		require('./src/command.localize-operations')
	].forEach(mod => mod(fotno));
};
