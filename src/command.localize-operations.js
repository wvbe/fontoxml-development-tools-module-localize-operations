'use strict';
const path = require('path'),
	os = require('os'),
	fs = require('fs'),
	glob = require('globby');

function getLocalizedOperation (operation) {
	['label', 'description']
		.filter(prop => !!operation[prop] && operation[prop].indexOf('t__') !== 0)
		.forEach(prop => {
			operation[prop] = 't__' + operation[prop];
		});

	return operation;
}


function localizeOperationsController (req, res) {
	res.caption(`fotno localize-operations`);

	res.debug('Looking for operations.json and operations-*.json files');

	const code = req.fdt.editorRepository;

	if (!code || !code.path) {
		throw new Error('Sorry, you must run this command in a Fonto editor instance');
	}
	const cwd = path.resolve(code.path, req.options.source),
		operationsJsons = glob.sync(['**/operations*.json'], {
			cwd: cwd
		});

	res.debug(`Localizing operations in ${operationsJsons.length} manifest files in "${req.options.source}".`);

	operationsJsons.forEach(globResult => {
		const operationsJsonPath = path.join(cwd, globResult);
		try {
			var manifestContent = require(operationsJsonPath);
		} catch (e) {
			res.property('Skip', path.basename(path.dirname(operationsJsonPath)), 7, 'error');
			res.error(e);
			return;
		}

		const newOperationsJsonContent = Object.keys(manifestContent).reduce((obj, operationName) => Object.assign(obj, {
			[operationName]: getLocalizedOperation(manifestContent[operationName])
		}), {});

		fs.writeFileSync(operationsJsonPath, JSON.stringify(newOperationsJsonContent, null, '\t') + os.EOL);

		res.property('Rewrote', path.relative(cwd, operationsJsonPath), 7);
	});

	res.success('Done');
}

module.exports = fotno => {
	fotno.registerCommand('localize-operations')
		.addAlias('lo')
		.setDescription(`Add the localization token around operation labels and descriptions`)
		.addOption(new fotno.Option('source')
			.setDefault('packages', true)
			.setDescription('Source directory to look for packages containing operation files. Defaults to "packages". Setting it to anything different is probably not a good idea.')
		)
		.setController(localizeOperationsController);
};
