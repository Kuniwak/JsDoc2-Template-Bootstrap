/**
 * クラスシンボルの出力用データを作成する。
 * 作成されたデータは"out"プロパティにオブジェクトとして設定される。
 * @param {JSDOC.Symbol} symbol クラスシンボル
 */
function setClassSymbolOutData(symbol) {

	//組み込みオブジェクトに属性を再設定する。
	if (symbol.isBuiltin()) {
		resetAttrsOfBuiltinObject(symbol);
	}

	symbol.hasConstructor = (symbol.is("CONSTRUCTOR") && !symbol.isBuiltin() && !symbol.isNamespace &&
	                        !symbol.isInterface && !symbol.isStaticClass && !symbol.isVirtualClass);
	symbol.hasInheritance = (!symbol.isNamespace && !symbol.isStaticClass && !symbol.isVirtualClass);

	symbol.events = symbol.getEvents();
	symbol.methods = symbol.getMethods();

	symbol.summarizedClassDesc = summarize(symbol.classDesc);
//	symbol.escapedSummarizedClassDesc = escapeHTML(symbol.summarizedClassDesc);

	symbol.linkedClassDesc = resolveLinks(symbol.classDesc);

	if (symbol.hasConstructor) {
		symbol.desc = makeConstructorDesc(symbol);
		symbol.summarizedDesc = summarize(symbol.desc);

		symbol.linkedDesc = resolveLinks(symbol.desc);
		symbol.linkedSummarizedDesc = (symbol.desc==symbol.summarizedDesc)?
		                               symbol.linkedDesc:resolveLinks(symbol.summarizedDesc);
	}
	else {
		symbol.linkedSummarizedDesc = (symbol.classDesc==symbol.summarizedClassDesc)?
		                               symbol.linkedClassDesc:resolveLinks(symbol.summarizedClassDesc);
	}
	
	var file = publish.symbolSet.getSymbol(symbol.srcFile);
	if (file) {
		file.defines.push(symbol.alias);
	}

	rebuildParams(symbol);

	var contributers = collectContributers(symbol.alias);
	var constants = [];
	var properties = [];
	var methods = [];
	var events = [];
	var inheritedConstants = {};
	var inheritedProperties = {};
	var inheritedMethods = {};
	var inheritedEvents = {};
	var hasInherited = { "constant": false, "property": false, "method": false, "event": false };
	var inheritedConstCount = 0;
	var inheritedPropCount = 0;
	var inheritedMethodCount = 0;
	var inheritedEventCount = 0;
	var privateConstCount = 0;
	var privatePropCount = 0;
	var privateMethodCount = 0;
	var privateEventCount = 0;

	symbol.properties.map(function($) {
		if ($.memberOf!=symbol.alias && $.isPrivate) return;

		//名前空間は除外
		if ($.isNamespace) return;

		var ary = ($.isConstant)?constants:properties;
		ary.push($);
		
		resetMemberSrcLineNum($, symbol);
		
		if ($.memberOf===symbol.alias) {
			$.summarizedDesc = summarize($.desc);
			//$.escapedSummarizedDesc = escapeHTML($.summarizedDesc);

			$.linkedDesc = resolveLinks($.desc);
			$.linkedSummarizedDesc = ($.desc==$.summarizedDesc)?$.linkedDesc:resolveLinks($.summarizedDesc);
			
			if ($.isPrivate) {
				$.isConstant?privateConstCount++:privatePropCount++;
			} 
		}
		else {
			if ($.isConstant && !inheritedConstants[$.memberOf]) {
				inheritedConstants[$.memberOf] = [];
				hasInherited.constant = true;
			}
			if (!$.isConstant && !inheritedProperties[$.memberOf]) {
				inheritedProperties[$.memberOf] = [];
				hasInherited.property = true;
			}
			var ary = ($.isConstant)?inheritedConstants[$.memberOf]:inheritedProperties[$.memberOf];
			ary.push($);

			$.isConstant?inheritedConstCount++:inheritedPropCount++;
		}
	});

	symbol.methods.map(function($) {
		if ($.memberOf!=symbol.alias && $.isPrivate) return;

		methods.push($);

		resetMemberSrcLineNum($, symbol);

		if ($.memberOf===symbol.alias) {
			rebuildParams($);
			rebuildReturnValues($);
			$.summarizedDesc = summarize($.desc);
			//$.escapedSummarizedDesc = escapeHTML($.summarizedDesc);

			$.linkedDesc = resolveLinks($.desc);
			$.linkedSummarizedDesc = ($.desc==$.summarizedDesc)?$.linkedDesc:resolveLinks($.summarizedDesc);

			if ($.srcLineNum<0 && $.srcFile===symbol.srcFile) {
				$.srcLineNum = symbol.srcLineNum;
				$.srcAnchor = symbol.srcAnchor;
			} 

			if ($.isPrivate || $.isInner) privateMethodCount++;
		}
		else {
			if (!inheritedMethods[$.memberOf]) {
				inheritedMethods[$.memberOf] = [];
				hasInherited.method = true;
			}

			inheritedMethods[$.memberOf].push($);
			inheritedMethodCount++;
		}
	});

	symbol.events.map(function($) {
		if ($.memberOf!=symbol.alias && $.isPrivate) return;

		events.push($);

		resetMemberSrcLineNum($, symbol);

		if ($.memberOf===symbol.alias) {
			rebuildParams($);
			rebuildReturnValues($);
			$.summarizedDesc = summarize($.desc);
			//$.escapedSummarizedDesc = escapeHTML($.summarizedDesc);

			$.linkedDesc = resolveLinks($.desc);
			$.linkedSummarizedDesc = ($.desc==$.summarizedDesc)?$.linkedDesc:resolveLinks($.summarizedDesc);

			if ($.srcLineNum<0 && $.srcFile===symbol.srcFile) {
				$.srcLineNum = symbol.srcLineNum;
				$.srcAnchor = symbol.srcAnchor;
			} 
			
			if ($.isPrivate || $.isInner) privateEventCount++;
		}
		else {
			if (!inheritedEvents[$.memberOf]) {
				inheritedEvents[$.memberOf] = [];
				hasInherited.event = true;
			}

			inheritedEvents[$.memberOf].push($);
			inheritedEventCount++;
		}
	});

	var sorter = makeSortby("name");
	constants = constants.sort(sorter);
	properties = properties.sort(sorter);
	methods = methods.sort(sorter);
	events = events.sort(sorter);
	contributers.map(function($) {
		if (inheritedConstants[$])  inheritedConstants[$] = inheritedConstants[$].sort(sorter);
		if (inheritedProperties[$]) inheritedProperties[$] = inheritedProperties[$].sort(sorter);
		if (inheritedMethods[$])    inheritedMethods[$] = inheritedMethods[$].sort(sorter);
		if (inheritedEvents[$])     inheritedEvents[$] = inheritedEvents[$].sort(sorter);
	});

	initOutProperty(symbol);

	symbol.out.contributers = contributers;
	symbol.out.constants = constants;
	symbol.out.properties = properties;
	symbol.out.methods = methods;
	symbol.out.events = events;

	symbol.out.inheritedConstants = inheritedConstants;
	symbol.out.inheritedProperties = inheritedProperties;
	symbol.out.inheritedMethods = inheritedMethods;
	symbol.out.inheritedEvents = inheritedEvents;

	symbol.out.hasInherited = hasInherited;
	symbol.out.inheritedConstCount = inheritedConstCount;
	symbol.out.inheritedPropCount = inheritedPropCount;
	symbol.out.inheritedMethodCount = inheritedMethodCount;
	symbol.out.inheritedEventCount = inheritedEventCount;

	symbol.out.privateConstCount = privateConstCount;
	symbol.out.privatePropCount = privatePropCount;
	symbol.out.privateMethodCount = privateMethodCount;
	symbol.out.privateEventCount = privateEventCount;

	//名前空間を取得し、自分をそのメンバとして登録する。
	var ns = symbol.alias.replace(/(.*)\.[^\.]+$/,"$1");
	symbol.out.namespace = (ns!=symbol.alias)?ns:"";
	if (symbol.out.namespace) {
		var nsSymbol = publish.symbolSet.getSymbol(symbol.out.namespace);
		if (nsSymbol && nsSymbol.isNamespace) {
			initOutProperty(nsSymbol);
			nsSymbol.out[(symbol.isNamespace?"namespaces":"classes")].push(symbol);
		}
	}

}

/**
 * @name ClassSynbolOutputData
 * @class クラスシンボルの出力用データ。[[setClassSymbolOutData]]関数内でシンボルの
 *        "out"プロパティに設定される。
 * @desc このオブジェクトはコンストラクタでは作成できない。
 * @property {String[]} contributers このクラスが継承しているメンバの定義元クラスのaliasの配列
 * @property {JSDOC.Symbol} constants  定数シンボルの配列。継承しているものも含む。
 * @property {JSDOC.Symbol} properties プロパティシンボルの配列。継承しているものも含む。
 * @property {JSDOC.Symbol} methods    メソッドシンボルの配列。継承しているものも含む。
 * @property {JSDOC.Symbol} events     イベントシンボルの配列。継承しているものも含む。
 * @property {JSDOC.Symbol} inheritedConstants  継承している定数シンボルの配列
 * @property {JSDOC.Symbol} inheritedProperties 継承しているプロパティシンボルの配列
 * @property {JSDOC.Symbol} inheritedMethods    継承しているメソッドシンボルの配列
 * @property {JSDOC.Symbol} inheritedEvents     継承しているイベントシンボルの配列
 * @property {Object} hasInherited 各タイプのメンバを継承しているかどうかを示すフラグをプロパティに持つオブジェクト。
 *                                 constant,property,method,eventの各プロパティにつき、継承しているものがあればtrue。
 * @property {Number} inheritedConstCount  継承している定数の数
 * @property {Number} inheritedPropCount   継承しているプロパティの数
 * @property {Number} inheritedMethodCount 継承しているメソッドの数
 * @property {Number} inheritedEventCount  継承しているイベントの数
 * 
 * @property {Number} privateConstCount  プライベート定数の数
 * @property {Number} privatePropCount   プライベートプロパティの数
 * @property {Number} privateMethodCount プライベートメソッドの数
 * @property {Number} privateEventCount  プライベートイベントの数
 */


/**
 * 組み込みオブジェクトを表すシンボルの属性を再設定する。
 * ただしドックコメントが記述されている場合は何もしない。
 * @param {JSDOC.Symbol} symbol 組み込みオブジェクトシンボル
 */
function resetAttrsOfBuiltinObject(symbol) {
	if (symbol.srcFile!="") return;

	switch (symbol.alias) {
		case "Array":
		case "Boolean":
		case "Error":
		case "Function":
		case "Number":
		case "Object":
		case "RegExp":
		case "String":
			symbol.isNamespace = false;
			break;
		case "Math":
			symbol.isNamespace = false;
			symbol.isStaticClass = true;
			break;
	}
}

/**
 * シンボルの"out"プロパティを初期化する。
 * @param {JSDOC.Symbol} クラスシンボル
 */
function initOutProperty(symbol) {
	if (symbol.out) return;

	symbol.out = {};
	if (symbol.isNamespace) {
		symbol.out.classes = [];
		symbol.out.namespaces = [];
	}
}

/**
 * ファイルシンボルに出力用プロパティを付加する。
 * @param {JSDOC.Symbol} file ファイルシンボル
 */
function setFileSymbolOutData(file) {
	file.outAlias = file.alias.replace(/[:\\\/]/g, "_");

	file.summarizedDesc = summarize(file.desc);

	file.dispPath = file.alias.replace(/\/\\/g, "/").replace(/\\/g, "/");
	file.fileName = FilePath.fileName(file.alias);

	//このファイルで定義されたクラスシンボルの配列を格納するプロパティ。
	//値はsetClassSymbolOutData内で設定される。
	file.defines = [];

	//@locationタグへの対応
	file.locations = file.comment.getTag("location").map(
	        function($){ return $.toString().replace(/(^\$ ?| ?\$$)/g, "").replace(/^HeadURL: https:/g, "http:");});

	//ドックコメント保持フラグ
	file.hasDesc = file.desc!="";
	file.hasMember = (file.author!="") || (file.version!="") || (file.locations.length>0);
	file.hasComment = file.hasDesc || file.hasMember;

//LOG.warn(file.fileName + " - " + file.hasComment);

}

/**
 * パラメータオブジェクトを出力用に再構成する。
 * @param {JSDOC.Symbol} symbol パラメータを持つシンボル
 */
function rebuildParams(symbol) {
	var params = symbol.params;
	if (!params || !params.length) return;

	var orgLen = params.length;
	var prmsByName = {};

	for (var i=0;i<orgLen;i++) {
		var prm = params.shift();
		var isPropPrm = false;

		if (/^([^\s]+?)\.(.+)$/.test(prm.name)) {
			var parentName = RegExp.$1;
			var prmName = RegExp.$2;

			var parentPrm = prmsByName[parentName];
			if (parentPrm) {
				prm.name = prmName;

				if (!parentPrm.properties) parentPrm.properties = [];
				parentPrm.properties.push(prm);
				isPropPrm = true;
			}
		}

		if (!isPropPrm) {
			params.push(prm);
			prmsByName[prm.name] = prm;
		}
	}
}

/**
 * 戻り値オブジェクトを出力用に再構成する。
 * @param {JSDOC.Symbol} symbol 戻り値を持つシンボル
 */
function rebuildReturnValues(method) {
	var returns = method.returns;
	if (!returns || (returns.length<2)) return;

	var retReturns = [];
	var currTarget = null;

	for (var i=0;i<returns.length;i++) {
		var rtn = returns[i];

		if (/^\.(\S+)\s+([\S\s]+)$/.test(rtn.desc)) {
			if (!currTarget) continue;
			rtn.name = RegExp.$1;
			rtn.desc = RegExp.$2;
			currTarget.properties.push(rtn);
		}
		else {
			currTarget = rtn;
			currTarget.properties = [];

			retReturns.push(rtn);
		}
	}

	method.returns = retReturns;
	method.type = retReturns.map(function($){return $.type}).join(", ");
}

/**
 * クラス階層を再帰的にたどり、重複のない継承元クラスの配列を作成する。
 * @param {String} targetAlias 処理対象のクラスシンボルのネームパス
 * @param {String[]} [contribList] 現在までに収集された継承元クラスのネームパスの配列
 * @param {String[]} [nameMap] 現在までに収集された継承元クラスのネームパスをキーに持つ連想配列。
 *                             循環参照を回避するために使用される。
 * @return {String[]} 作成された継承元クラスのネームパスの配列
 */
function collectContributers(targetAlias, contribList, nameMap) {
	if (!contribList) contribList = [];
	if (!nameMap) {
		nameMap = {};
		nameMap[targetAlias] = true;
	}

	var target = JSDOC.Parser.symbols.getSymbol(targetAlias);
	if (!target) return contribList;

	var augs = target.augments;
	for (var i=0;i<augs.length;i++) {
		var alias = augs[i].desc;
		if (nameMap[alias]) continue;

		contribList.splice(0,0,alias);
		nameMap[alias] = true;

		contribList = arguments.callee(alias, contribList, nameMap);
	}

	return contribList;
}

/**
 * クラスメンバのソースコードの行番号を再設定する。
 * @param {JSDOC.Symbol} member クラスメンバのシンボル
 * @param {JSDOC.Symbol} classSymbol メンバが属しているクラスのシンボル
 */
function resetMemberSrcLineNum(member, classSymbol) {
	if (member.srcLineNum>0) return;
	if (member.memberOf!==classSymbol.alias) return;
	if (member.srcFile!==classSymbol.srcFile) return;
	
	member.srcLineNum = classSymbol.srcLineNum;
	member.srcAnchor  = classSymbol.srcAnchor;
};


//----------------------------------------------------------------------------------------


/**
 * クラス詳細ページのパラメータ部分のHTMLテキストを作成する。
 * @param {JSDOC.DocTag} param パラメータタグ
 * @return {String} 作成されたHTMLテキスト
 */
function makeParamNameDesc(param) {
	var ret = "<b>"+param.name+"</b>";
	if (param.isOptional) {
		if (param.defaultValue) ret += "="+param.defaultValue;
		ret = "["+ret+"]";
	}

	return ret;
}

/**
 * 説明文の最初のセンテンスを切り出す。ただしドットで区切られた名称が区切りとみなされないように
 * するため、ドットの後ろにはスペースや改行が必要。
 * @param {String} desc 完全な説明文
 * @return {String} 切り出された説明文
 */
function summarize(desc) {
	if (typeof desc != "undefined") {
		return desc.match(Kw.summarizeRegExp)? RegExp.$1 : desc;
	}
}

/**
 * ソースファイルを読み込み、ハイライトされたドキュメントに変換して出力する。
 * 変換処理はプラグイン内で実行される。
 * @param {String} path ソースファイルのパス
 * @param {String} outDir 出力ディレクトリ
 * @param {String} [name] 出力ファイル名。省略した場合、入力ファイルの名前がそのまま使用される。
 */
function makeSrcFile(path, outDir, name) {
	if (JSDOC.opt.s) return;

	if (!name) {
		name = path.replace(/\.\.?[\\\/]/g, "").replace(/[\\\/]/g, "_");
		name = name.replace(/\:/g, "_");
	}

	var src = {path: path, name:name, charset: IO.encoding, hilited: ""};

	if (defined(JSDOC.PluginManager)) {
		JSDOC.PluginManager.run("onPublishSrc", src);
	}

	if (src.hilited) {
		IO.saveFile(outDir, name+publish.conf.ext, src.hilited);
	}
}

/**
 * 関数（メソッド、コンストラクタ）のパラメータ部分のHTMLテキストを作成する。
 * @param {JSDOC.DocTag[]} params パラメータタグの配列
 * @return {String} 作成されたHTMLテキスト
 */
function makeSignature(params) {
	if (!params) return "()";

	var isFirst = true;
	var signature = "("
	+
	params.filter(
		function($) {
			return $.name.indexOf(".") == -1; // don't show config params in signature
		}
	).map(
		function($) {
			var name = $.name;
			if (!isFirst) name = ", " + name;
			if ($.isOptional) name = "["+name+"]";
			isFirst = false;

			return name;
		}
	).join(" ")
	+
	")";
	return signature;
}

/**
 * ツール情報を含む奥付を作成する。
 * @return {String} 作成されたHTMLテキスト
 */
function fineprint() {
	var copyright = JSDOC.opt.D.copyright?"Copyright &copy; "+JSDOC.opt.D.copyright+"<br/>":"";

	var text = Kw.fineprint;
	text = text.replace(/%jsdoc-toolkit%/, "<a href='http://code.google.com/p/jsdoc-toolkit/' target='_blank'>JsDoc Toolkit "+JSDOC.VERSION+"</a>");
	text = text.replace(/%template%/, "<a href='http://www12.atwiki.jp/aias-jsdoctoolkit/' target='_blank'>"+publish.conf.name+" "+publish.conf.version+"</a>");
	text = text.replace(/%date%/, new Date());

	return copyright + text;
}

/**
 * 必要なキーワードをドキュメント内のJavaScript変数として出力する。
 * @return {String} 作成されたJavaScriptコード
 */
function writeKeywords() {
	return  "Kw="+toLiteral({
		clas: {
			linkFrame:   Kw.clas.linkFrame,
			linkNoFrame: Kw.clas.linkNoFrame
		}
	})+";";
}

/**
 * コンストラクタの説明文を作成する。説明文がなかった場合はデフォルトのテキストを返す。
 * @param {JSDOC.Symbol} symbol クラスシンボル
 * @return {String} 作成されたテキスト
 */
function makeConstructorDesc(symbol) {
	if (symbol.desc) return symbol.desc;

	if (symbol.isAbstractClass) {
		return Kw.clas.defaultAbstractConstructorDesc.replace(/%class-alias%/,symbol.alias);
	}

	return Kw.clas.defaultConstructorDesc.replace(/%class-alias%/,symbol.alias);
}

/**
 * クラスシンボルの継承関係を表す系統図を作成する。
 * @param {JSDOC.Symbol} symbol クラスシンボル
 * @param {String} cssClass 引数で指定したシンボルに適用されるCSSクラス
 * @return {String} 作成されたテキスト
 */
function makeInheritanceLine(symbol, cssClass) {
	var inheritLine = "";
	var aug = symbol.augments;
	while (aug.length) {
		if (aug.length>1) {
			inheritLine = "("
			            + aug.map(function($){ return new Link().toSymbol($) }).join(", ")
			            + ") " + Kw.clas.arrowLeft + " " + inheritLine;
			break;
		}
		else {
			inheritLine = (new Link().toSymbol(aug)) + " " + Kw.clas.arrowLeft + " " + inheritLine;
			var smbl = JSDOC.Parser.symbols.getSymbol(aug);
			if (!smbl) break;
			aug = smbl.augments;
		}
	}

	inheritLine += "<span class='"+cssClass+" bold' >"+symbol.alias+"</span>";

	var inheritedTos = symbol.inheritedTo;
	if (inheritedTos && inheritedTos.length) {
		inheritLine += " " + Kw.clas.arrowLeft + " " +
			inheritedTos.map(function($) { return new Link().toSymbol($) }).join(", ");
	}

	return inheritLine;
}


/**
 * クラス詳細ページで使用される、クラスメンバの属性とデータ型を表すHTMLテキストを作成する。
 * @param {JSDOC.Symbol} item クラスメンバのシンボル
 * @param {String} [sepStr=""] 属性とデータ型の区切り文字。
 * @param {String} [unknownType="undefined"] 未知のデータ型に適用される名称
 * @param {Boolean} [wrap=false] 項目を折り返すならtrue
 * @return {String} 作成されたHTMLテキスト
 */
function makeAttribute(item, sepStr, unknownType, wrap) {
	var ret = [];
	if (item.isAbstract)  ret.push("&lt;abstract&gt;");
	if (item.isProtected) ret.push("&lt;protected&gt;");
	if (item.isPrivate)   ret.push("&lt;private&gt;");
	if (item.isInner)     ret.push("&lt;inner&gt;");
	if (item.isStatic && !item.is("CONSTRUCTOR")) ret.push("&lt;static&gt;");
	if (item.isReadOnly)  ret.push("&lt;readOnly&gt;");

	//２項目ごとに折り返し
	if (wrap===true) {
		for (var i=2;i<ret.length;i+=3) {
			ret.splice(i, 0, "<br />");
		}
	}

	if (ret.length>0) ret.push(sepStr);
	ret.push((item.type?(new Link().toSymbol(item.type)):unknownType));

	return ret.join("");
}

/**
 * クラス属性文字列を作成する。
 * @param {JSDOC.Symbol} item クラスシンボル
 * @return {String} 作成されたHTMLテキスト
 */
function writeClassTypeAttr(item) {
	var type = "Class";
	if (item.isStaticClass) type = "Static Class";
	if (item.isVirtualClass) type = "Virtual Class";
	if (item.isAbstractClass) type = "Abstract Class";
	if (item.isInterface) type = "Interface";
	return "&lt;"+type+"&gt;";
}

/**
 * クラスの属性を表すCSSクラス文字列を作成する。
 * @param {JSDOC.Symbol} symbol クラスシンボル
 * @param {Boolean} isInherited 継承したメンバならtrue
 * @return {String} 作成されたCSSテキスト
 */
function writeClassAttributeCSS(symbol, isInherited) {
	var ret = [];
	if (isInherited) ret.push("isInherited");
	if (symbol.isPrivate || symbol.isInner) ret.push("isPrivate");
	
	return ret.join(" ");
}

/**
 * クラス詳細ページにおける概要欄に記述するクラスメンバ名部分のHTMLテキストを作成する。
 * @param {JSDOC.Symbol} symbol クラスメンバのシンボル
 * @param {String} classAlias 詳細ページの対象クラスのネームパス
 * @return {String} 作成されたHTMLテキスト
 */
function writeSummaryMemberName(symbol, classAlias) {
	var memberOf = (symbol.isStatic && symbol.memberOf != "_global_")?symbol.memberOf+".":"";
	return memberOf + new Link().toSymbol(symbol.alias, classAlias)
	                            .withText(symbol.name.replace(/\^\d+$/,""))
	                            .id("smry_"+Link.symbolNameToLinkName(symbol))
	                            .bold();

}


/**
 * クラス詳細ページにおける継承メンバの折りたたみ表の1行分のHTMLテキストを作成する。
 * @param {JSDOC.Symbol} contributer メンバが定義されているクラスのシンボル
 * @param {JSDOC.Symbol[]} members contributerから継承されているメンバのシンボルの配列
 * @return {String} 作成されたHTMLテキスト
 */
function writeInheritedMembersRow(contributer, members) {
	if (!contributer) return "";

	var ret = "<tr><th class='lendClassName fixedFont normal' >";
	ret += new Link().toSymbol(contributer.alias);
	ret += "</th><td>";
	ret += members.map(writeInheritedMember).join(", ");
	ret += "</td></tr>";

	return ret;
}


/**
 * クラス詳細ページにおける継承メンバの折りたたみ表内に表示され1件のクラスメンバのHTMLテキストを作成する。
 * @param {JSDOC.Symbol} symbol クラスメンバのシンボル
 * @return {String} 作成されたHTMLテキスト
 */
function writeInheritedMember(symbol) {
	var link = new Link().toSymbol(symbol.alias)
	                     .withText(symbol.name)
	                     .italic(symbol.isStatic);
	var linkName = Link.symbolNameToLinkName(symbol);
	return 	"<span class='"+resolveFixedFontClass(symbol)+"'>"+link.id(linkName)+"</span>";
}


/**
 * リスト形式のタグ説明文を作成する。
 * @param {JSDOC.DocTag[]} items リスト表示するタグの配列
 * @return {String} 作成されたHTMLテキスト
 */
function writeListItems(items) {
	if (!(items instanceof Array)) {
		return resolveLinks(items);
	}

	if (items.length==1) {
		return resolveLinks(items[0]);
	}

	var ret = ["<ul class='list' >"];
	for (var i=0;i<items.length;i++) {
		ret.push("<li>"+resolveLinks(items[i])+"</li>");
	}
	ret.push("</ul>");

	return ret.join("");
}


/**
 * クラスシンボルの出力に使われるCSSクラス名を返す。
 * @param {JSDOC.Symbol} symbol クラスシンボル
 * @return {String} 作成されたテキスト
 */
function resolveClassCSSClass(symbol) {
	var cssClass = "classNormal";
	var img = "class";

	if (symbol.isNamespace) {
		cssClass = "namespace";
		img = "namespace";
	}
	else if (symbol.isStaticClass) {
		cssClass = "classStatic";
		img = "staticclass";
	}
	else if (symbol.isAbstractClass) {
		cssClass = "classAbstract";
		img = "abstractclass";
	}
	else if (symbol.isVirtualClass) {
		cssClass = "classVirtual";
		img = "virtualclass";
	}
	else if (symbol.isInterface) {
		cssClass = "interface";
		img = "interface";
	}

	if (symbol.deprecated) {
		cssClass = "deprecated";
		img += "_dep";
	}

	return cssClass += " symicon_classes symicon_"+img;
};


/**
 * クラスメンバのアイコンを表すCSSクラス名を返す。
 * @param {JSDOC.Symbol} item クラスメンバのシンボル
 * @param {String} type タイプ。"constant","property","method","event"
 * @param {Boolean} inherited 他のクラスから継承したメンバならtrue
 * @return {String} CSSクラス名
 */
function resolveClassMemberIcon(item, type, inherited) {
	attr = "";
	if (item.deprecated) {
		attr += "_dep";
	}
	else {
		if (item.isProtected) {
			attr += "_pro";
		}
		else if (item.isPrivate || item.isInner) {
			attr += "_pri";
		}
		else {
			attr += "_nml";
		}

		if (inherited) attr += "_ih";
	}

	if (item.isStatic) attr += "_s";

	return "symicon_"+ type +" symicon" + attr;
};


/**
 * シンボルの属性に応じたテキストのCSSクラス名を作成して返す。
 * @param {JSDOC.Symbol} item シンボルオブジェクト
 * @return {String} CSSクラス
 */
function resolveFixedFontClass(item) {
	var ret = "";
	if (item.isAbstract) ret += "italic ";

	if (item.deprecated) {
		ret += "deprecated";
	}
	else if (item.isProtected) {
		ret += "protected";
	}
	else if (item.isPrivate || item.isInner) {
		ret += "private";
	}
	else {
		ret += "normal";
	}

	return ret;
}

/**
 * シンボルのソースコードへのリンクアイコンを出力する。
 * @param {JSDOC.Symbol} symbol シンボル
 * @param {String} [cssClass] リンクに追加適用されるCSSクラス
 * @return {String} 作成されたHTMLテキスト
 */
function writeSrcFileLink(symbol, cssClass) {
	if (JSDOC.opt.s) return ""; 
	
	var div = "<div class='srcLink_out' onmouseover='hSrcLinkMouseOver(this)' onmouseout='hSrcLinkMouseOut(this)' ></div>";
	
	return new Link().toSrc(symbol.srcFile).inner(symbol.srcAnchor)
	                 .withText(div).title(Kw.clas.srcLink).cssClass("srcLink "+ (cssClass || ""));
}


/**
 * サマリページのクラスリストで表示される1クラス分のHTMLテキストを作成する。
 * @param {JSDOC.Symbol} symbol クラスシンボル
 * @return {String} 作成されたHTMLテキスト
 */
function writeClassSummary(symbol) {
	var ret = "";
	var classAlias = symbol.alias;

	ret += "<div id='"+classAlias+"_mark' class='arrowBtn arrowBtn_close' ></div>";

	var link = new Link().toClass(classAlias).target("detail")
	                     .cssClass("className bold " + resolveClassCSSClass(symbol));

	if (symbol.alias=="_global_") link.italic(true);
	ret += "<div class='itemName' ><span class='dummy' >&nbsp;</span>" + link + "</div>";

	var out = symbol.out;
	ret += "<div id='"+classAlias+"_membox' class='smryClassMemberBox' >";

	var members = [];
	members = members.concat(out.constants.map(function($){
		          return writeClassSummary._makeSummaryLink($, "constant", classAlias);
		      }));
	members = members.concat(out.properties.map(function($){
		          return writeClassSummary._makeSummaryLink($, "property", classAlias);
		      }));
	members = members.concat(out.methods.map(function($){
		          return writeClassSummary._makeSummaryLink($, "method", classAlias);
		      }));
	members = members.concat(out.events.map(function($){
		          return writeClassSummary._makeSummaryLink($, "event", classAlias);
		      }));
	ret += members.join("");

	ret += "</div>";

	return "<div id='"+classAlias+"_c' class='classSummary relative' >"+ret+"</div>";
}


/** サマリページのクラスリストで表示される1クラスメンバ分のHTMLテキストを作成する。 @private */
writeClassSummary._makeSummaryLink = function(item, type, memberOf) {
	var img = " "+ resolveClassMemberIcon(item, type, (item.memberOf!=memberOf));

	var id = item.alias.replace(/^.+([#.-].+)$/, memberOf+"$1") + "_m";
	return  "<div id='" + id + "' ><span>&nbsp;</span>"
	         + new Link().target("detail")
	                     .toSymbol(item.alias, memberOf)
	                     .withText(item.name)
	                     .cssClass("smryMemberName symicon "+resolveFixedFontClass(item) + img)
	         + "</div>";
};


/**
 * サマリページのフィルタ機能で使用する、全クラスの情報を含むオブジェクトリテラルを返す。
 * @param {JSDOC.Symbol[]} classSymbols クラスシンボルの配列。"out"プロパティが追加されていなければならない。
 * @return {String} 生成されたオブジェクトリテラル
 */
function makeSymbolObjectsString(classSymbols) {
	var self = arguments.callee;
	var objs = [];
	var aliasMap = {};

	for (var i=0;i<classSymbols.length;i++) {
		var cls = classSymbols[i];
		var obj = {};
		obj.name = cls.name;
		obj.alias = cls.alias;
		obj.isClass = true;

		var func = function($) {
			return self._appendMemberObject($, cls.alias, objs, aliasMap);
		};

		var members = [];
		members = members.concat(cls.out.constants.map(func));
		members = members.concat(cls.out.properties.map(func));
		members = members.concat(cls.out.methods.map(func));
		members = members.concat(cls.out.events.map(func));
		obj.members = members;

		aliasMap[obj.alias] = objs.length;
		objs.push(obj);
	}

	var ret = "";
	ret += "var symbolObjects=[\n"+ objs.map(self._dump).join(",\n") +"\n];\n";
	ret += "var aliasMap="+self._dump(aliasMap);

	return ret;
}

/** クラスメンバを表すオブジェクトを作成し、引数の配列objectsに追加する。 @private */
makeSymbolObjectsString._appendMemberObject = function(member, parent, objects, aliasMap) {
	var obj = {};
	obj.name = member.name;
	obj.parent = parent;
	obj.isPrivate = (member.isPrivate || member.isInner);

	var alias = member.alias.replace(/.+([\.#-].+)$/, parent+"$1");
	obj.alias = alias;

	aliasMap[obj.alias] = objects.length;
	objects.push(obj);
	return alias;
};

/** オブジェクトをダンプする。 @private */
makeSymbolObjectsString._dump = function(object) {
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


/**
 * シンボルの配列から、それらの特定のプロパティ値の配列を表すJSコードの「文字列」を作成して返す。
 * @param {JSDOC.Symbol[]} symbols シンボルの配列
 * @param {String} propName プロパティ名
 * @return {String} プロパティ値の配列を表す文字列
 */
function makePropertyValueArray(symbols, propName) {
	return "[" + symbols.map(function($){ return "\""+$[propName]+"\"" }).join(",") + "]";
}


/**
 * 概要ページシンボルを作成する。
 * @param {String} path 概要ページのコメントを含むファイルのパス。
 *                      絶対パスまたはテンプレートディレクトリからの相対パスを指定する。
 * @return {JSDOC.Symbol} 作成されたファイルシンボル
 */
function createOverviewSymbol(path) {
	var text = "";

	//概要コメントを含むファイルを読み込む。
	//最初に絶対パスを、次にテンプレートディレクトリからの相対パスを試す。
	if (path) {
		try { text = IO.readFile(path); } catch(e) {}
		try { text = IO.readFile(publish.conf.templatesDir+path); } catch(e) {}
	}

	//概要コメントを取り出す。ファイルがない場合は空のコメントを作成する。
	if (text) {
		var res = text.match(/(\/\*\*[\S\s]+?\*\/)/);
		if (res) text = res[1];
	}
	else {
		text = "/** */";
	}

	var symbol = new JSDOC.Symbol("_overview_", [], "FILE", new JSDOC.DocComment(text));
	symbol.namespaces = publish.symbolSet.toArray().filter(
	      function($){ return $.isNamespace && $.alias!="_global_" && !$.isBuiltin() }).sort(makeSortby("alias"));
	symbol.appName = symbol.comment.getTag("appName")[0] || "";

	return symbol;
}


/**
 * テキストに含まれるcodeタグをハイライト済みのソースに変換する。
 * @param {String} desc 元テキスト
 * @return {String} 成形済みテキスト
 */
function convInlineCodes(desc) {
	return desc.replace(/(?:<pre>)?\s*<code>[\r\n]*([\S\s]+?)[\r\n]*<\/code>\s*(?:<\/pre>)?/ig, function() {
		return "<div class='inlineCode' >"+ writeExample(arguments[1]) + "</div>";
	});
}

/**
 * サンプル表示画面のHTMLテキストを返す。
 * @param {String} example サンプルコード
 * @return {String} 生成されたHTMLテキスト
 */
function writeExample(example) {
	var id = writeExample._id++;
	
	var ret = "";
	ret += "<div id=\"example_"+ id +"_hl\">";
	ret += "<pre class=\"code SRCBODY\" >" + srcHilite(example) + "</pre>";
	ret += "<a href=\"javascript:void(0)\" onclick=\"showExamplePlain("+id+")\" class=\"exampleLink\" >&#8811;"+Kw.clas.examplePlain+"</a>";
	ret += "</div>";
	ret += "<div id=\"example_"+ id +"_pt\" style=\"display:none;\" >";
	ret += "<pre class=\"code SRCBODY\" >" + example + "</pre>";
	ret += "<a href=\"javascript:void(0)\" onclick=\"showExampleHilited("+id+")\" class=\"exampleLink\" >&#8811;"+Kw.clas.exampleHilited+"</a>";
	ret += "</div>";
	
	return ret;
}

writeExample._id = 0;

/**
 * ハイライトされたソースコードを表すHTMLテキストを作成する。
 * @param {String} src ソースコード
 * @return {String} 生成されたHTMLテキスト
 */
function srcHilite(src) {
	var tr = new JSDOC.TokenReader();
	tr.keepComments = true;
	tr.keepDocs = true;
	tr.keepWhite = true;
	
	var tokens = tr.tokenize(new JSDOC.TextStream(src));

	var hilited = tokens.map(srcHilite._outToken).join("");
	hilited = hilited.replace(/<span class="COMM">\/\*\*/g, "<span class=\"DOCCMT\">/**");
	
	var replaceDocTag = function() {
				return arguments[1]+"<span class=\"DOCTAG\">"+arguments[2]+"</span>";
			};
	hilited = hilited.replace(/<span class="DOCCMT">(.|\s)+?<\/span>/g,
					function(m) {
						m = m.replace(/(\s)(@\w+)/g, replaceDocTag);
						m = m.replace(/({)(@link)/g, replaceDocTag);
						return m;
					});
	hilited = hilited.replace(/\t/g, srcHilite._indent);
	
	var line = 1;
	hilited = hilited.replace(/(^|\r\n|\r|\n)/g, function(m) {
					return m+"<span class=\"LINENUM\">"+((line<10)? " ":"")+((line<100)? " ":"")+(line++)+"</span> ";
				});

	return hilited;

}

srcHilite._outToken = function(token) {
	return "<span class=\""+token.type+"\">"+token.data.replace(/</g, "&lt;")+"</span>";
};

//カスタマイズされたpublishSrcHiliteプラグインが導入されていれば、そのスタイルを使用する。
srcHilite.css = (function() {
	var styles = JsHilite.styles ||
						{
						  "body":    "",
						  "keyWord": "color: #933",
						  "docCmt":  "color: #bbb; font-style: italic",
						  "docTag":  "color: #bbb; font-style: italic",
						  "comment": "color: #bbb; font-style: italic",
						  "number":  "color: #393",
						  "string":  "color: #393",
						  "regexp":  "color: #339",
						  "lineNum": "border-right: 1px dotted #666; color: #666; font-style: normal;"
						};

	var ret = "";
	ret += ".SRCBODY {"+styles.body+"}\n";
	ret += ".KEYW {"+styles.keyWord+"}\n";
	ret += ".COMM {"+styles.comment+"}\n";
	ret += ".NUMB {"+styles.number+"}\n";
	ret += ".STRN {"+styles.string+"}\n";
	ret += ".REGX {"+styles.regExp+"}\n";
	ret += ".LINENUM {"+styles.lineNum+"}\n";
	ret += ".DOCCMT {"+styles.docCmt+"}\n";
	ret += ".DOCTAG {"+styles.docTag+"}\n";

	return ret;
})();

srcHilite._indent = (function() {
	var ret = "\t";
	var tabToSpace = defined(JsHilite.tabToSpace)?JsHilite.tabToSpace:-1;
	if (tabToSpace > -1) {
		ret = "";
		for (var i=0;i<tabToSpace;i++) {
			ret += "&nbsp;";
		}
	}
	
	return ret;
})();
