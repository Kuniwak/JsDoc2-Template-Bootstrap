/**
 * 指定されたファイルを読み込み、その内容を文字列として返す。
 * @param {String} path ファイルのパス。テンプレートディレクトリからの相対パスで記述する。
 * @param {String} [encoding="utf-8"] ファイルの文字コーディング
 * @return {String} ファイルの内容
 */
function include(path, encoding) {
	var orgEnc;
	if (typeof encoding != "undefined") {
		orgEnc = IO.encoding;
		IO.setEncoding(encoding);
	}

	var path = publish.conf.templatesDir +  path;
	var ret = IO.readFile(path);

	if (orgEnc) IO.setEncoding(orgEnc);

	return ret;
}


//----------------------------------------------------------------------------------------


/**
 * テンプレートオブジェクトを作成して返す。
 * @param {String} template テンプレートファイルのパス
 * @param {String} [encoding="utf-8"] ファイルの文字コーディング
 * @return {JSDOC.JsPlate} 生成されたテンプレートオブジェクト
 */
function templateFactory(template, encoding) {
	encoding = encoding || "utf-8";
	var orgEnc = IO.encoding;
	IO.setEncoding(encoding);

	var ret = new JSDOC.JsPlate(template);
	IO.setEncoding(orgEnc);

	return ret;
}


//----------------------------------------------------------------------------------------



/**
 * シンボルの配列に対しプロパティ値によるソートを行うための関数を作成して返す。
 * 作成された関数はArray#sortメソッドの引数に渡されることが想定されている。
 * @param {String} prop ソート条件に使用するプロパティ名
 * @return {Function} ソート関数
 * @example
 * var simbols = symbolSet.toArray();
 *
 * //aliasプロパティでソートされた配列を作成する。
 * var sortedSymbols = simbols.sort(makeSortby("alias"));
 */
function makeSortby(prop) {
	return function(a, b) {
		if (a[prop] != undefined && b[prop] != undefined) {
			a = a[prop].toLowerCase();
			b = b[prop].toLowerCase();
			if (a < b) return -1;
			if (a > b) return 1;
			return 0;
		}
	}
}


/**
 * 引数で指定された文字列をHTMLリンクに変換する。 変換ルールは下記のとおり。
 * <ol style="list-style-type:decimal" >
 * <li>文字列全体がネームパスの場合、当該シンボルへのリンクに変換する。</li>
 * <li>文字列中に含まれる@linkタグを、当該シンボルへのリンクに変換する。</li>
 * <li>上記以外は通常の文字列のまま。</li>
 * </ol>
 * @param {String} str 変換元文字列
 * @return {String} 変換された文字列
 */
function resolveLinks(str) {
	if (Link.symbolSet.hasSymbol(str)) {
		return new Link().toSymbol(str);
	}

	str = String(str).replace(/\{@link ([^} ]+) ?\}/gi,
		function(match, symbolName) {
			if (Link.symbolSet.hasSymbol(symbolName)) {
				return new Link().toSymbol(symbolName);
			}

			var linkText = symbolName.replace(/^[#.-]?(event:)?/, "");
			if (symbolName.indexOf("#")!==0) symbolName = "#"+symbolName;
			return "<a href='"+symbolName+"' >"+linkText+"</a>";
		}
	);

	return str;
}

/**
 * 文字列中のHTML特殊文字をエスケープする。
 * @param {String} str 変換元文字列
 * @return {String} 変換された文字列
 */
function escapeHTML(str) {
	if (!str) return str;

	return str.replace(/[&<>"']/g, function(match) {
			return {
				"&" : "&amp;",
				"<" : "&lt;",
				">" : "&gt;",
				'"' : "&quot;",
				"'" : "&#039;"
			}[match];
	    });
}


/**
 * オブジェクトをオブジェクトリテラルに展開する。
 * @param {*} object 処理対象の値。オブジェクトでなくてもよい。
 * @return {String} オブジェクトリテラル文字列
 */
function toLiteral(object) {
	switch(typeof object) {
		case "number":
		case "boolean":
			return object;
		case "string":
			return "\""+object+"\"";
		case "object":
			if (object==null) {
				return "null";
			}
			else if (object instanceof Array) {
				return "["+object.map(arguments.callee).join(",")+"]";
			}
			else {
				var ret = [];
				for (var prop in object) {
					ret.push("\""+prop+"\":"+ arguments.callee(object[prop]));
				}
				return "{"+ret.join(",")+"}";
			}
		default:
			return "undefined";
	}
};
