// Copyright (c) 2020 Ruby Allison Rose (aka. M3TIOR)
//
// Permission is hereby granted, free of charge, to any person obtaining
// a copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to
// permit persons to whom the Software is furnished to do so, subject to
// the following conditions:
//
// The above copyright notice and this permission notice shall be
// included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
// EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
// LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
// OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

"use-strict";


// Internal Imports
//...

// External Imports
import acorn from "acorn";
import sandboxr from "sandboxr";

// Standard Imports
//...


class ImportError {
	constructor() {

	}
}

function preprocessImports(ast){

}

/**
 * @function
 * @param {string} code - The code you wish to be ran.
 * @param {object} options - configuration parameters to be passed.
 * ecmaVersion: Sets the target ECMAScript version for both Acorn and SandBoxr.
 *   Max is currently set to 6 due to SandBoxr's limitations.
 * sourceType: Can be one of "script", "module", or "auto'; default is "auto".
 * modules: An object containing key, value pairs where the key is the module
 *   lookup name, and the value, is it's loaded value.
 * primitiveBlacklist: Allows you to blacklist primitives.
 * acornOptions: Options passed directly to Acorn.
 *   See https://github.com/acornjs/acorn/tree/master/acorn for arguments.
 * sandboxrOptions: Options passed directly to SandBoxr.
 *   See https://github.com/jrsearles/SandBoxr for arguments.
 */
export default function(code, options){
	let acornOpts = options.acornOptions || {};
	let sandboxrOpts = options.sandboxrOptions || {};
	let imports = options.imports || {};

	if (options){
		const {
			sourceType, ecmaVersion, primitivesBlacklist, forceStrict
		}/**************************************************************/ = options;

		// NOTE: we have to overwrite the general options with the API specific
		//   options to give those APIs access to their unique config values.
		acornOpts = Object.assign({
			sourceType,
			ecmaVersion
		}, acornOpts);

		sandboxrOpts = Object.assign({
			primitivesblacklist as exclude,
			forceStrict as useStrict,
			ecmaVersion,
		}, sandboxrOpts);
	}

	let ast = null;
	if (acornOpts.sourceType === "auto" || acornOpts.sourceType == null){
		// NOTE: I know it's really funky; but it's more performant. The below
		//   try/catch statement both determines how to parse the input code,
		//   and sets the acornOpts.sourceType to the correct value when done.
		try {
			acornOpts.sourceType = "script";
			ast = acorn.parse(code, acornOpts);
		}
		catch(e) {
			if(e.message.search("sourceType: module") > -1)
				ast = acorn.parse(code, Object.assign(acornOpts, {sourceType: "module"}));
			else
				throw e;
		}
	}
	else {
		ast = acorn.parse(code, acornOpts);
	}

	if (acornOpts.sourceType === "script"){

	}
	else if (acornOpts.sourceType === "module"){
		const endImports = ast.body.findIndex(e => e.type !== "ImportDeclaration");
		const importStatements = ast.body.slice(0, endImports);
		const importEnvironment = sandboxr.createEnvironment();

		importStatements
			.filter((elm) => elm.type === "ImportDeclaration")
			.forEach((module) => {
				module.specifiers.map((spec) => {
					if (spec.type === "ImportDefaultSpecifier" || spec.type === "ImportSpecifier") {
						const binding = importEnvironment.createVariable(spec.local.name, "const");
						if (spec.imported == null)
							binding.setValue(spec.local.name, true); // throws on error
						else
							binding.setValue(spec.imported.name, true); // throws on error
					}
				});
			});
	}
}
