//----------------------------------------------------------------------------------------
//  ブラウザ判定
//----------------------------------------------------------------------------------------
/**
 * @namespace ブラウザ情報オブジェクト
 * @property {Boolean} isIE      IE6以上であればtrue、そうでなければfalse
 * @property {Boolean} isIE6     IE6であればtrue、そうでなければfalse
 * @property {Boolean} isIE7     IE7であればtrue、そうでなければfalse
 * @property {Boolean} isIE8     IE8であればtrue、そうでなければfalse
 * @property {Boolean} isFF      Firefoxであればtrue、そうでなければfalse
 * @property {Boolean} isFF2     Firefox2であればtrue、そうでなければfalse
 * @property {Boolean} isFF3     Firefox3であればtrue、そうでなければfalse
 * @property {Boolean} isSafari  Safariであればtrue、そうでなければfalse
 * @property {Boolean} isSafari2 Safari2であればtrue、そうでなければfalse
 * @property {Boolean} isSafari3 Safari3であればtrue、そうでなければfalse
 * @property {Boolean} isSafari4 Safari4であればtrue、そうでなければfalse
 * @property {Boolean} isOpera   Operaであればtrue、そうでなければfalse
 * @property {Boolean} isChrome  Chromeであればtrue、そうでなければfalse
 * @property {Boolean} isUnknown 識別可能なブラウザでなければtrue、可能ならfalse
 */
var Br = new function() {
	this.isIE = false;
	this.isIE6 = false;
	this.isIE7 = false;
	this.isIE8 = false;
	this.isFF = false;
	this.isFF2 = false;
	this.isFF3 = false;
	this.isSafari = false;
	this.isSafari2 = false;
	this.isSafari3 = false;
	this.isSafari4 = false;
	this.isOpera = false;
	this.isChrome = false;
	this.isUnknown = false;

	var ua = navigator.userAgent;
	if (window.opera) {
		this.isOpera = true;
	}
	else if (ua.match(/MSIE ([0-9])\./i)) {
		this.isIE = true;
		switch(RegExp.$1) {
			case "6": this.isIE6 = true; break;
			case "7": this.isIE7 = true; break;
			case "8": this.isIE8 = true; break;
		}
	}
	else if (ua.indexOf("Chrome")!=-1) {
		this.isChrome = true;
	}
	else if (ua.indexOf("Safari")!=-1) {
		this.isSafari = true;
		if (ua.indexOf("AppleWebKit/4")!=-1) {
			this.isSafari2 = true;
		}
		else if (/^.+Version\/(\d)\..+$/.test(ua)) {
			switch(RegExp.$1) {
				case "3": this.isSafari3 = true; break;
				case "4": this.isSafari4 = true; break;
			}
		}
	}
	else if (/^.+Firefox\/(\d)\.(\d).+$/.test(ua)) {
		this.isFF = true;
		switch(RegExp.$1) {
			case "2": this.isFF2 = true; break;
			case "3": this.isFF3 = true; break;
		}
	}
	else {
		this.isUnknown = true;
	}

};




//----------------------------------------------------------------------------------------
//  ユーティリティ
//----------------------------------------------------------------------------------------

/**
 * 指定された配列の複製を返す。複製は"浅いコピー"で行われる。
 * @param {*[]} array 複製対象の配列
 * @return {*[]} 複製された配列
 */
function cloneArray(array) {
	return [].concat(array);
}


/**
 * CSSルールを追加する。ルールは既存CSSの末尾に設定される。
 * @param {String|String[]} rules CSSルール文字列（例： ".sel { padding:1px; }" ）またはその配列
 * @param {String} [media=all] メディア（例："all","screen","print",...）
 */
appendCSSRules = function(rules, media) {
	if (typeof(rules)=="string") rules = [rules];

	//ロード前なら、document.writeで追加
	if (!document.body) {
		document.write("<style type='text/css' media='" + (media?media:"all") + "' >");
		for (var i=0;i<rules.length;i++) {
			document.write(rules[i]);
		}
		document.write("</style>");
	}
	//ロード後
	else {
		var styleTag = document.createElement("style");
		styleTag.setAttribute("type", "text/css");
		styleTag.setAttribute("media", (media?media:"all"));
		document.getElementsByTagName("head")[0].appendChild(styleTag);
		var sheet = document.styleSheets[document.styleSheets.length-1];

		if (Br.isSafari2) {
			for (var i=0;i<rules.length;i++) {
				styleTag.appendChild(document.createTextNode(rules[i]));
			}
		}
		else if (Br.isIE) {
			for (var i=0;i<rules.length;i++) {
				var rule = rules[i];

				rule = rule.replace(/(\r|\n)/g," ").replace(/ +/g," ");
				var ret = rule.match(/^(.+) *\{(.+)\}\s*$/);
				if (!ret) continue;

//alert(ret[1]+","+ret[2]);

				sheet.addRule(ret[1], ret[2], sheet.rules.length);
			}
		}
		else {
			for (var i=0;i<rules.length;i++) {
				sheet.insertRule(rules[i], sheet.cssRules.length);
			}
		}
	}
}


/**
 * 指定された関数を実行するクロージャを返す。 @private
 * @param {Function} func 関数
 * @param {Object} thisObj 関数内でthisとして参照されるオブジェクト
 * @param {*} [args] 関数に渡される引数。複数指定可能。
 * @return {Function} クロージャ
 */
function bind(func, thisObj, args) {
	return function() {
		if (!args) {
			tmp = arguments;
		} else {
			if (arguments.length>0) {
				tmp = args.concat([]);
				for (var i=0;i<arguments.length;i++) {
					tmp.push(arguments[i]);
				}
			} else {
				tmp = args;
			}
		}
		return func.apply(thisObj,tmp);
	};
}

/**
 * Cookieに書き込む。
 * @param {String} name 項目名
 * @param {String} [value] 値。値が無い場合は項目を削除する。
 * @param {Date} [exp] 有効期限
 * @param {String} [path] パス
 * @param {String} [domain] ドメイン
 */
function writeCookie(name, value, expires, path, domain) {
	if (name==null) return;

	//値が無い場合は、項目を削除する。
	if (value==null||value==="") {
		expires = new Date();
		expires.setTime(0);
		value = "";
	}

	var str = name + "=" + encodeURIComponent(value);
	if (expires) str += ";expires=" + expires.toGMTString();
	if (path) str += ";path=" + path;
	if (domain) str += ";domain=" + domain;
	document.cookie = str;
}

/**
 * Cookieを読み出す。
 * @param {String} [name] 項目名
 * @return 項目名が指定された場合は項目の値（項目が無ければ空文字）を返す。
 *         項目名が指定されなかった場合は、項目名をキーとする全項目値の配列を返す。
 * @type String|String[]
 */
function readCookie(name) {
	var cks = (document.cookie)?document.cookie.split(";"):"";
	if (!cks) return ((name)?"":[]);

	var ret = [];
	for (var i=0;i<cks.length;i++) {
		var ck = cks[i].split("=");
		if (typeof(ck)!="object") continue;

		ck[0] = ck[0].replace(" ","");
		if (name&&ck[0]==name) {
			return decodeURIComponent(ck[1]);
		}
		else {
			ret[ck[0]] = decodeURIComponent(ck[1]);
		}
	}

	return ((name)?"":ret);
}

/**
 * Cookieの有効期限を返す。 @private
 * @param {Number} day 有効期限日数
 * @return {Date} 有効期限
 */
function makeExpires(day) {
	if (day==null) day = 1;
	var exp = new Date();
	exp.setTime(exp.getTime()+(day*24*60*60*1000));
	return exp;
}

/**
 * 指定されたid属性をもつDOM要素を返す。
 * @param {String} id id
 * @return {DOMElement} DOM要素。存在しない場合はnull。
 */
function $(id) {
	return document.getElementById(id);
}

/**
 * 指定された値が未定義（undefined）でなければtrueを返す。
 * @param {*} value 値
 * @return {Boolean} 値が未定義（undefined）でなければtrue
 */
function defined(value) {
	return typeof value != "undefined";
}


//----------------------------------------------------------------------------------------

function showExamplePlain(id) {
	$("example_"+id+"_hl").style.display = "none";
	$("example_"+id+"_pt").style.display = "block";
	return false;
}

function showExampleHilited(id) {
	$("example_"+id+"_hl").style.display = "block";
	$("example_"+id+"_pt").style.display = "none";
	return false;
}

function hSrcLinkMouseOver(elm) {
	elm.className = "srcLink_over";
}

function hSrcLinkMouseOut(elm) {
	elm.className = "srcLink_out";
}

//----------------------------------------------------------------------------------------

function makeLinkToNewWindow(pathToTop) {
	var link = $("linkNewWnd");
	if (!link) return;
	
	if (window.top==window) {
		link.href = pathToTop;
		link.innerHTML = Kw.clas.linkFrame;
	}
	else {
		link.href = "#";
		link.innerHTML = Kw.clas.linkNoFrame;
	}
}

