/*global console*/
//
// loadScript.js defines loadScript(), a global function for performing asynchronous
// script loads.
//
// https://github.com/zynga/loadScript
// Author: Chris Campbell (@quaelin)
// License: BSD
//
(function (win, doc, undef) {
	var
		loadScript,
		funcName = 'loadScript',
		VERSION = '0.1.6',
		had = Object.prototype.hasOwnProperty.call(win, funcName),
		previous = win[funcName],
		loading = {},
		loaded = {}
	;

	function log(msg) {
		if (typeof console !== 'undefined' && console && console.log) {
			console.log(msg);
		}
	}

	// Perform text substitutions on `origURL` according to the substitution
	// rules stored in localStorage `key` (if present).  This is a developer
	// feature; to use it, you must name the localStorage key by setting it like
	// this:
	//
	//   loadScript.key = 'loader_rules';
	//
	// Then you can set the corresponding value in localStorage to a JSON-ified
	// array of arrays, where each inner array is a pair of the form:
	//
	//   [searchtext, replacetext]
	//
	// This allows the developer to load, for instance, a newer or unminified
	// version of a particular script.
	function rewrite(origURL) {
		var substitutions = [], key = loadScript.key;
		if (key) {
			try {
				substitutions = JSON.parse(localStorage.getItem(key)) || [];
			} catch (ex) {
			}
		}
		var i = -1, len = substitutions.length, rule, url = origURL;
		while (++i < len) {
			rule = substitutions[i];
			url = url.replace(rule[0], rule[1]);
		}
		if (url !== origURL) {
			log(funcName + ': rewrite("' + origURL + '")');
			log(' => "' + url + '"');
		}
		return url;
	}

	// Here is the loadScript() function itself.
	loadScript = win[funcName] = function (requestURL , /*optional*/ attributes_, /*optional*/callback_)
	{
		var
			el,
			url = rewrite(requestURL),
			needToLoad = !loading[url],
			q = loading[url] = loading[url] || [],
			attributes,
			callback
		;

		if (arguments.length > 1)
		{
			if (typeof attributes_ == "object")
			{
				attributes = attributes_;

				if (arguments.length > 2)
				{
					if (typeof callback_ == "function")
					{
						callback = callback_;
			}
		}
			}
			else if (typeof attributes_ == "function")
			{
				callback = attributes_;

				attributes = undefined;
			}
		}

		if (loaded[url])
		{
			if (typeof callback == "function")
			{
				callback();
			}

			return;
		}

		if (typeof callback == "function")
		{
			q.push(callback);
		}

		function onLoad()
		{
			loaded[url] = true;
			while (q.length) {
				q.shift()();
			}
		}

		function onError()
		{
			loaded[url] = false;
			while (q.length) {
				q.shift()(new Error("Network or File Not Found error (\"" + url + "\")"));
			}
		}

		if (needToLoad)
		{
			el = doc.createElement('script');
			el.type = 'text/javascript';
			el.charset = 'utf-8';
			el.src = url;

			if (el.addEventListener) // IE9+ & others
			{
				el.addEventListener('load', onLoad, false);
				el.addEventListener('error', onError, false);

				doc.getElementsByTagName('head')[0].appendChild(el);
			}
			else
			{ // IE8
				el.attachEvent('onreadystatechange', function()
					{
						if (el.readyState == "complete")
						{
							doc.getElementsByTagName('head')[0].appendChild(el);

							onLoad();
			}
						else if (el.readyState == "loaded")
						{
							// hack: calling 'children' property changes node's readyState from 'loaded' to complete
							// (if script was loaded normally) and calls the onreadystate event handler again
							// or to 'loading' - if error detected
							//noinspection BadExpressionStatementJS
							el.children;

							if (el.readyState == 'loading') // error detected
							{
			doc.getElementsByTagName('head')[0].appendChild(el);

								onError();
							}
						}
					}
				);
			}

			if (url !== requestURL)
			{
				el.setAttribute('data-requested', requestURL);
			}

			if (attributes)
			{
				var key;
				for (key in attributes)
				{
					if (!attributes.hasOwnProperty(key) || (typeof attributes[key] != "string"))
					{
						continue;
					}

					el.setAttribute(key, attributes[key]);
				}
			}




		}
	};

	loadScript.VERSION = VERSION;

	loadScript.noConflict = function () {
		if (win[funcName] === loadScript) {
			win[funcName] = had ? previous : undef;
			if (!had) {
				try {
					delete win[funcName];
				} catch (ex) {
				}
			}
		}
		return loadScript;
	};
}(this, document));
