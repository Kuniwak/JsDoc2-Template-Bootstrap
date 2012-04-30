/**
 * @staticClass クラスツリーを操作するオブジェクト
 * @property {Boolean}        filterEnabled 一定間隔で繰り返されるフィルタの再実行を行うならtrue
 * @property {SymbolFilter}   _filter 現在使用されているフィルタオブジェクト
 * @property {FilterFactory}  _filterFactory 条件に応じたフィルタを生成するオブジェクト
 * @property {String}         _prevWord 前回のフィルタリング処理に使用した条件文字列
 * @property {FilterResult}   _prevResult 前回のフィルタリング処理結果
 * @property {SymbolObjest[]} _prevDispClasses 前回のフィルタリング結果で表示状態となっているクラスシンボルオブジェクト
 * @property {Boolean}        _csens 現在の大文字小文字区別設定。区別するならtrue
 * @property {Number}         _mtype 現在のマッチ判定。 0=前方一致、1=部分一致
 * @property {Boolean}        _showPrivates プライベートメンバを表示するならtrue
 */
var TreeOperator = {
	classes: null,
	filterEnabled: false,
	configOpened: false,
	_filter: null,
	_filterFactory: null,
	_prevWord: "",
	_prevResult: null,
	_prevDispClasses: [],
	_csens: false,
	_mtype: 1,
	_showPrivates: false
};


/** フィルタ処理の実行間隔（ミリ秒） @final 500 @private */
TreeOperator._APPLY_INTERVAL = 500;


/**
 * オブジェクトを初期化する。
 * @param {SymbolObject[]} symbols テンプレートが作成したシンボルオブジェクトの配列
 */
TreeOperator.init = function(symbols, aliasMap) {
	this._symbols = symbols;
	this._aliasMap = aliasMap;
	
	//設定をCookieから読み出し
	this._csens = readCookie("aiasframe_csens")=="1";
	var mtype = readCookie("aiasframe_mtype");
	this._mtype = mtype===""?1:parseInt(mtype);

	var handler = bind(this._handlerModeChange, this);

	var chkCase = $("caseSensitive");
	chkCase.checked = this._csens;
	chkCase.onclick = handler;

	$(this._mtype===0?"mtypePrefix":"mtypePertial").checked = true;
	$("mtypePrefix").onclick = handler;
	$("mtypePertial").onclick = handler;

	//クラス開閉ボタンを初期化する。
	for (var i=0;i<this.classes.length;i++) {
		this._initClassExpandBtn(this.classes[i]);
	}

	//フィルタファクトリを作成し、初期設定にあわせたフィルタを選択する。
	this._filterFactory = new FilterFactory(symbols);
	this._selectFilter();

	//フィルタ文字入力ボックスを初期化する。
	var filterWord = this._initFilterWordBox();

	this._initConfigBtn();

	//初期状態の結果を設定
	this._prevResult = this._filter.apply("");
	this.showPrivateMembers((readCookie("aiasframe_hideprvt")!="1"));

//	debug("", this._prevResult, new FilterResult([],[]));

	setInterval(bind(this._applyFilter, this, [filterWord]), this._APPLY_INTERVAL);
};

/**
 * クラス開閉ボタンを初期化する。 @private
 * @param {String} alias クラスのネームパス
 */
TreeOperator._initClassExpandBtn = function(alias) {
	var btn = $(alias+"_mark");
	if (!btn) return;

	btn.onclick = function() {
		TreeOperator.setClassExpand(alias, !btn.isOpened);
		btn.onmouseover();
	};

	btn.onmouseover = function() {
		btn.className = "arrowBtn arrowBtn_"+(btn.isOpened?"open":"close")+"_sel";
		return false;
	};

	btn.onmouseout = function() {
		btn.className = "arrowBtn arrowBtn_"+(btn.isOpened?"open":"close");
		return false;
	};

	btn.title = this.msgOpenClassBtn;
	btn.isOpened = false;
};

/**
 * フィルタ文字入力ボックスを初期化する。 @private
 */
TreeOperator._initFilterWordBox = function() {
	var filterWord = $("filterWord");
	filterWord.onfocus = function() {
		if (filterWord.initFlg || filterWord.nullFlg) {
			filterWord.style.color = "#353535";
			filterWord.value = "";
			filterWord.initFlg = false;
			filterWord.nullFlg = false;
		}

		TreeOperator.filterEnabled = true;
	};

	filterWord.onblur = function() {
		TreeOperator.filterEnabled = false;

		if (filterWord.value=="") {
			filterWord.style.color = "RGB(170,170,170)";
			filterWord.value = TreeOperator.filterCaption;
			filterWord.nullFlg = true;
		}
	};

	filterWord.value = this.filterCaption;
	filterWord.initFlg = true;
	filterWord.nullFlg = true;

	return 	filterWord;
};

/**
 * フィルタ設定開閉ボタンを初期化する。 @private
 */
TreeOperator._initConfigBtn = function() {
	var configBtn = $("filterConfigBtn");

	configBtn.onmouseover = function() {
		configBtn.className = "expandBtn expandBtn_"+(TreeOperator.configOpened?"open":"close")+"_sel";
		return false;
	};

	configBtn.onmouseout = function() {
		configBtn.className = "expandBtn expandBtn_"+(TreeOperator.configOpened?"open":"close");
		return false;
	};

	configBtn.onclick = function() {
		TreeOperator.openFilterConfig(!TreeOperator.configOpened);
		configBtn.onmouseover();
	};

	configBtn.title = TreeOperator.msgOpenConfigBtn;
};

/**
 * フィルタ設定開閉ボタンの開閉処理
 * @param {Boolean} mode true=設定を開く、false=設定を閉じる
 */
TreeOperator.openFilterConfig = function(mode) {
	TreeOperator.configOpened = mode;

	$("filterConfig").style.display = mode?"block":"none";

	var configBtn = $("filterConfigBtn");
	configBtn.className = "expandBtn expandBtn_"+(mode?"open":"close");
	configBtn.title = mode?TreeOperator.msgCloseConfigBtn:TreeOperator.msgOpenConfigBtn;

	resize();
};

/**
 * 共通DOMイベントハンドラ。 thisはTreeOperatorオブジェクト。 @private
 */
TreeOperator._handlerModeChange = function() {
	this._csens = $("caseSensitive").checked;
	this._mtype = $("mtypePrefix").checked?0:1;

	this._selectFilter();
	this._prevWord = null;

	//設定をCookieに保存
	writeCookie("aiasframe_csens", (this._csens?"1":"0"), makeExpires(3));
	writeCookie("aiasframe_mtype", this._mtype, makeExpires(3));
};


/**
 * 現在の設定に応じたフィルタオブジェクトを選択する。 @private
 */
TreeOperator._selectFilter = function() {
	this._filter = this._filterFactory.getFilter(this._mtype, this._csens);
	return this._filter;
};


/**
 * フィルタを適用する。このメソッドは一定間隔で繰り返し実行される。 @private
 * @param {DOMElement} box 検索テキストボックス
 */
TreeOperator._applyFilter = function(box) {
	if (!this.filterEnabled) return;

	var currWord = box.value;
	if (currWord===this._prevWord) return;
	this._prevWord = currWord;

	var result = this._filter.apply(currWord);

//	debug(currWord, result, this._prevResult);

	//現在表示されているクラスを全て折りたたむ。
	for (var i=0;i<this._prevDispClasses.length;i++) {
		this.setClassExpand(this._prevDispClasses[i], false);
	}
	this._prevDispClasses = [];

	var unmatches = result.diff(this._prevResult);
	for (var i=0;i<unmatches.length;i++) {
		var item = unmatches[i];
		this._dispTreeItemElement(item.alias, item.isClass, false);
		if (item.isClass) {
			//クラスメンバの表示状態を更新する。
			for (var j=0;j<item.members.length;j++) {
				this._dispTreeItemElement(item.members[j], false, false);
			}
		}
		else {
			//親項目の表示状態を更新する。
			this._dispTreeItemElement(item.parent, true, false);
		}
	}

	for (var i=0;i<result.matches.length;i++) {
		var item = result.matches[i];
		if (item.isClass) {
			this._dispTreeItemElement(item.alias, true, true);

			//クラスメンバの表示状態を更新する。
			for (var j=0;j<item.members.length;j++) {
				var symbolObj = this._symbols[this._aliasMap[item.members[j]]];
				if (!this._showPrivates && symbolObj.isPrivate) continue;
				this._dispTreeItemElement(item.members[j], false, true);
			}

			this._prevDispClasses.push(item.alias);
		}
		else {
			var symbolObj = this._symbols[this._aliasMap[item.alias]];
			if (this._showPrivates || !symbolObj.isPrivate) {
				this._dispTreeItemElement(item.alias, item.isClass, true);
			}

			//親項目がマッチしているならここでは何もしない。
			if (!result.aliasMap[item.parent]) {
				//親項目の表示状態を更新する。
				this._dispTreeItemElement(item.parent, true, true);
				this._prevDispClasses.push(item.parent);

				//親項目を展開する。
				this.setClassExpand(item.parent, true);
			}
		}
	}

	this._prevResult = result;
};


/**
 * クラスツリーの項目であるDOM要素の表示状態を設定する。 @private
 * @param {String} alias シンボルのネームパス
 * @param {Boolean} isClass シンボルがクラスならtrue
 * @param {Boolean} mode 表示するならtrue
 */
TreeOperator._dispTreeItemElement = function(alias, isClass, mode) {
	var id = alias + (isClass?"_c":"_m");
	$(id).style.display = mode?"block":"none";
};


/**
 * クラスの開閉状態を設定する。
 * @param {String} alias シンボルのネームパス
 * @param {Boolean} [mode] 項目を展開するならtrue、折りたたむならfalse。
 *                         省略した場合、現在の設定を反転させる。
 */
TreeOperator.setClassExpand = function(alias, mode) {
	var memBox = $(alias+"_membox");
	memBox.style.display = mode?"block":"none";

	var btn = $(alias+"_mark");
	btn.isOpened = mode;
	btn.className = "arrowBtn arrowBtn_"+(mode?"open":"close");
	btn.title = mode?this.msgCloseClassBtn:this.msgOpenClassBtn;

	resize();
}


//function debug(word, result, prev) {
//	var debug = "";
//
//	debug += "<word>\n"+word+"\n";
//
//	debug += "<match>\n";
//	for (var i=0;i<result.matches.length;i++) {
//		debug += result.matches[i].alias+"\n";
//	}
//
//	var diffs = result.diff(prev);
//
//	debug += "\n<diff>\n";
//	for (var i=0;i<diffs.length;i++) {
//		debug += diffs[i].alias+"\n";
//	}
//
//	$("filterResult").value = debug;
//}


/**
 * プライベートメンバの表示／非表示を設定する。
 * @param {Boolean} mode プライベートメンバを表示するならtrue
 */
TreeOperator.showPrivateMembers = function(mode) {
	this._showPrivates = mode;

	for (var i=0;i<this._symbols.length;i++) {
		var symbol = this._symbols[i];
		
		if (!symbol.isPrivate) continue;
		
		var visible = (mode && defined(this._prevResult.aliasMap[symbol.alias]));
		this._dispTreeItemElement(symbol.alias, false, visible);
	}
};

//----------------------------------------------------------------------------------------

/**
 * @class 指定に応じたフィルタを作成するファクトリクラス
 * @param {SymbolObject[]} symbols フィルタリング対象となるシンボルオブジェクトの配列
 *
 * @property {MatchItem[]} _matchItems フィルタ内マッチング処理用シンボルオブジェクトの配列
 * @property {MatchConfig[]} _matchConfs フィルタにセットされるマッチング設定オブジェクトの配列。
 *                                       マッチングタイプをインデックスに持つ。
 * @property {SymbolFilter[]} _filters フィルタオブジェクトの連想配列。フィルタ条件識別子をキーに持つ。
 */
function FilterFactory(symbols) {
	this._matchItems = MatchConfig.createMatchItems(symbols);

	this._matchConfs = [];
	this._filters = [];
}

/**
 * 条件に応じたフィルタオブジェクトを返す。同一条件に対しては必ず同じインスタンスが返される。
 * @param {Number} matchType マッチングタイプ。0=前方一致、1=部分一致
 * @param {Boolean} caseSensitive 大文字小文字を区別するならtrue
 * @return {SymbolFilter} フィルタオブジェクト
 */
FilterFactory.prototype.getFilter = function(matchType, caseSensitive) {

	//フィルタ条件識別子を作成
	var key = "f";
	key += matchType;
	key += caseSensitive?"1":"0";

	if (this._filters[key]) {
		return this._filters[key];
	}

	var matchConf = this._getMatchConfig(matchType);
	if (!matchConf) return null;

	var ret = this._filters[key] = new SymbolFilter(matchConf, caseSensitive);
	return ret;
};


/**
 * 条件に応じたマッチング設定オブジェクトを返す。同一条件に対しては必ず同じインスタンスが返される。
 * @private
 * @param {Number} matchType マッチングタイプ。0=前方一致、1=部分一致
 * @return {MatchConfig} マッチング設定オブジェクト
 */
FilterFactory.prototype._getMatchConfig = function(matchType) {

	if (this._matchConfs[matchType]) {
		return this._matchConfs[matchType];
	}

	if (matchType===0) {
		var matchPrefix = this._matchConfs[matchType] = new MatchConfig();
		matchPrefix.getIndexKey = function(itemWord){ return itemWord.charAt(0) };
		matchPrefix.matchWords = function(word,itemWord){ return itemWord.indexOf(word)===0 };
		matchPrefix.setMatchItems(this._matchItems);
		return matchPrefix;
	}

	if (matchType===1) {
		var matchPartial = this._matchConfs[matchType] = new MatchConfig();
		matchPartial.matchWords = function(word,itemWord){
//			console.log(word, itemWord, itemWord.indexOf(word));

			return itemWord.indexOf(word)!==-1
		};
		matchPartial.setMatchItems(this._matchItems);
		return matchPartial;
	}

	return null;
}


//----------------------------------------------------------------------------------------

/**
 * @class マッチング設定クラス。テンプレートメソッドを実装することで、様々なマッチング条件を表現する。
 * @property {MatchItem[]} items 登録されているマッチング用シンボルオブジェクトの配列
 * @property {Object} _indexSen 大文字小文字を区別するインデックス
 * @property {Object} _indexIns 大文字小文字を区別しないインデックス
 */
function MatchConfig() {
	this.items = [];
	this._indexSen = null;
	this._indexIns = null;
}

/**
 * 引数で渡されたシンボルのキーワードに対応するインデックスオブジェクトのキーを返す。
 * このメソッドに関数が設定されない場合、インデックスオブジェクトは作成されない。
 * @function
 * @param {String} word シンボルのマッチング用キーワード
 * @return {String} インデックスのキー文字列
 */
MatchConfig.prototype.getIndexKey = null;

/**
 * オブジェクトに対しマッチング用シンボルオブジェクトの配列を設定する。
 * [[MatchConfig#getIndexKey]]メソッドに関数が設定されている状態でこのメソッドを実行すると、内部にインデックスが作成される。
 * @param {MatchItem[]} items マッチング用シンボルオブジェクトの配列
 */
MatchConfig.prototype.setMatchItems = function(items) {
	this.items = items;

	this._indexSen = null;
	this._indexIns = null;

	if (this.getIndexKey) {
		var idxSen = [];
		var idxIns = [];
		for (var i=0;i<items.length;i++) {
			var item = items[i];
			var key = this.getIndexKey(item.word);

			//まだその文字のインデックスがない場合は作成し、項目を追加。
			if (!idxSen[key]) idxSen[key] = [];
			idxSen[key].push(item);

			//大文字小文字を区別しない版
			var key = key.toLowerCase();
			if (!idxIns[key]) idxIns[key] = [];
			idxIns[key].push(item);
		}
		this._indexSen = idxSen;
		this._indexIns = idxIns;
	}
};

/**
 * インデックスからキーワードにマッチするマッチング用シンボルオブジェクトを返す。
 * インデックスが作成されていない場合は登録されている全てのシンボルオブジェクトを返す。
 * @param {String} word マッチングキーワード
 * @param {Boolean} caseSensitive 大文字小文字を区別するならtrue
 * @return {MatchItem[]} キーワードにマッチしたマッチング用シンボルオブジェクトの配列
 */
MatchConfig.prototype.getItemsFromIndex = function(word, caseSensitive) {
	var index = (caseSensitive==true)?this._indexSen:this._indexIns;

	if (index) {
		return index[this.getIndexKey(word)] || [];
	}
	else {
		return this.items;
	}
};

/**
 * マッチ判定を行う。
 * @param {String} word マッチングキーワード
 * @param {String} itemWord シンボルのキーワード
 * @param {Boolean} caseSensitive 大文字小文字を区別するならtrue
 * @return {Boolean} マッチしていればtrue
 */
MatchConfig.prototype.match = function(word, itemWord, caseSensitive) {
	if (!caseSensitive) {
		word = word.toLowerCase();
		itemWord = itemWord.toLowerCase();
	}

	return this.matchWords(word, itemWord);
};

/**
 * オーバーライドして独自のマッチ処理を実装するためのメソッド。
 * [[MatchConfig#match]]メソッドから呼び出される。
 * @param {String} word マッチングキーワード
 * @param {String} itemWord シンボルのキーワード
 * @return {Boolean} マッチしていればtrue
 */
MatchConfig.prototype.matchWords = function(word, itemWord) {
	return true;
};

/**
 * シンボルオブジェクトの配列からマッチング用シンボルオブジェクトの配列を作成して返す。
 * @param {SymbolObject[]} symbol シンボルオブジェクトの配列
 * @return {MatchItem[]} マッチング用シンボルオブジェクトの配列
 */
MatchConfig.createMatchItems = function(symbols) {
	var ret = [];

	for (var i=0,l=symbols.length;i<l;i++) {
		var symbol = symbols[i];

		//nameとaliasでインデックスを作成。
		ret.push(new MatchItem(symbol.name, symbol));

		//ネームパスの区切り文字は"."に統一。
		var alias = symbol.alias.replace(/[#-]/g,".");
		ret.push(new MatchItem(alias, symbol));
	}

	return ret;
};


/**
 * @class マッチング用シンボルオブジェクト。 キーワードとシンボルへの参照をプロパティに持つ。
 * @param {String} word キーワード
 * @param {SymbolObject} symbol シンボルオブジェクト
 * @property {String} word キーワード
 * @property {SymbolObject} symbol シンボルオブジェクト
 */
function MatchItem(word, symbol) {
	this.word = word;
	this.symbol = symbol;
}

//----------------------------------------------------------------------------------------

/**
 * @class シンボルのフィルタリングを実行するクラス
 * @param {MatchConfig} matchConfig マッチング設定オブジェクト
 * @param {Boolean} [caseSensitive=false] trueの場合、大・小文字を区別する。
 *
 * @property {MatchConfig} _match マッチング設定オブジェクト
 * @property {Boolean} _caseSns trueの場合、大・小文字を区別する。
 * @property {MatchItem[]} _prevMatchItems 前回マッチしたマッチング用シンボルオブジェクトの配列
 * @property {String} _prevWord 前回使用した検索語
 * @property {Object} _cache 検索語をプロパティ名、フィルタ結果をプロパティ値とするオブジェクト
 */
function SymbolFilter(matchConfig, caseSensitive) {
	this._match = matchConfig;
	this._caseSns = (caseSensitive===true);
	this._prevMatchItems = matchConfig.items;
	this._prevWord = "";
	this._cache = {};
}

/**
 * フィルタを適用し、その結果を返す。
 * マッチングはキーワードとシンボルのネームパスまたは名前を前方一致による比較で行われる。
 * @param {String} word キーワード
 * @return {FilterResult} フィルタリング結果
 */
SymbolFilter.prototype.apply = function(word) {
	if (!word) word = "";

	//キャッシュが存在すればそれを返す。
	if (this._cache[word]) {
		return this._cache[word];
	}

	//フィルタリングするターゲットを確定する。
	var currTargets = this._resolveTargets(word);

	//ターゲットから名前がマッチするものを取り出す。
	var result = this._filter(word, currTargets);

	//結果をキャッシュに保存。
	this._cache[word] = result;

	return result;
};

/**
 * フィルタリング処理対象とする索引項目の集合を決定する。 @private
 * @param {String} word キーワード
 * @return {MatchItem[]} マッチング用シンボルオブジェクトの配列
 */
SymbolFilter.prototype._resolveTargets = function(word) {

	//今回の検索文字に前回の検索文字が含まれる場合、前回の検索結果からのみフィルタリングする。
	var prev = this._prevWord;
	this._prevWord = word;

	if (word==="") {
		return this._match.items;
	}
	else if (this._match.match(prev, word, this._caseSns)) {
		return this._prevMatchItems;
	}
	else {
		return this._match.getItemsFromIndex(word, this._caseSns);
	}
};

/**
 * フィルタリング処理を実行する。 @private
 * @param {String} word キーワード
 * @param {MatchItem[]} targets 処理対象となるマッチング用シンボルオブジェクトの配列
 * @return {FilterResult} フィルタ処理結果
 */
SymbolFilter.prototype._filter = function(word, targets) {
	var matchClasses = [];
	var matchMembers = [];
	var matchItems = [];
	var aliasMap = {};

	//symbolの重複出力をチェックするためのマップ。
	//名前空間の階層では同一aliasがクラスとメンバの両方に出現するため、
	// alias+タイプ（クラス/メンバ）をキーとして判定を行う。
	var idMap = {};

	//検索文字に前方マッチする項目を集める。
	for (var i=0;i<targets.length;i++) {
		var item = targets[i];
		if (this._match.match(word, item.word, this._caseSns)) {
			var itemId = item.symbol.alias + (item.symbol.isClass?"_c":"_m");
			if (!idMap[itemId]) {
				var matches = item.symbol.isClass?matchClasses:matchMembers;
				matches.push(item.symbol);

				idMap[itemId]= item.symbol;

				if (!aliasMap[item.symbol.alias]) {
					aliasMap[item.symbol.alias] = item.symbol;
				}
			}

			matchItems.push(item);
		}
	}

	//クラス（名前空間）、クラスメンバの順に出力する。
	var matchesAll = matchClasses.concat(matchMembers);

	this._prevMatchItems = matchItems;

	return new FilterResult(matchesAll, aliasMap);
};


//----------------------------------------------------------------------------------------

/**
 * @class フィルタリング結果クラス。 通常{@link SymbolFilter#apply }メソッドの戻り値として取得される。
 * @param {SymbolObject[]} matches フィルタにマッチしたシンボルオブジェクトの配列
 * @param {Object}   aliasMap matchesプロパティに含まれるシンボルのネームパスをキーに持つマップ。
 *                            値はシンボルオブジェクト。
 * @property {SymbolObject[]} matches フィルタにマッチしたシンボルオブジェクトの配列
 * @property {Object}   aliasMap matchesプロパティに含まれるシンボルのネームパスをキーに持つマップ。
 *                               値はシンボルオブジェクト。
 */
function FilterResult(matches, aliasMap) {
	this.matches = matches;
	this.aliasMap  = aliasMap;
}

/**
 * このオブジェクトの内容(A)と、引数で指定された結果オブジェクト(B)との差（B-A）をシンボルの配列として返す。
 * @param {FilterResult} result フィルタ処理結果
 * @return {SymbolObject[]} シンボルの配列
 */
FilterResult.prototype.diff = function(result) {
	var ret = [];
	for (var i=0;i<result.matches.length;i++) {
		var item = result.matches[i];
		if (!this.aliasMap[item.alias]) {
			ret.push(item);
		}
	}

	return ret;
};


//----------------------------------------------------------------------------------------

/**
 * @name SymbolObject
 * @class テンプレートがJSDOC.Symbolオブジェクトから生成したフィルタリング処理用のシンボルクラス。
 *        クラス（と名前空間）とクラスメンバ（定数/プロパティ/メソッド/イベント/関数）だけを表す。
 * @property {String} alias ネームパス
 * @property {String} name 名前 （単純なメソッド名のような、階層情報を含まない名称）
 * @property {Boolean} isClass このシンボルがクラスまたは名前空間ならtrue
 * @property {String[]} members シンボルがクラスの場合、それに属するメンバのネームパスの配列。
 *                              シンボルがクラスでない場合、プロパティ自体存在しない。
 */


//----------------------------------------------------------------------------------------


function resize() {
	if (!document.body || !document.documentElement) return false;

	var base = $("base");
//	var scrWidth = document.body.clientWidth || document.documentElement.clientWidth;
	var scrHeight = document.body.clientHeight || document.documentElement.clientHeight;

	var textBoxWidth = $("filter").offsetWidth -19;
	$("filterWord").style.width = (textBoxWidth -6) + "px";
	$("filterConfigBtn").style.left = (textBoxWidth +6) + "px";


	var listFrame = $("classListFrame");
// 	listFrame.style.width = scrWidth + "px";
 	listFrame.style.height = (scrHeight - listFrame.offsetTop -1) + "px";

 	return true;
};

resize.tim = null;


//----------------------------------------------------------------------------------------

/** ページの初期化 @event */
window.onload = function() {
	TreeOperator.init(symbolObjects, aliasMap);
	resize();
};


window.doresize = function() {
	if (resize.tim) clearTimeout(resize.tim);
	resize.tim = setTimeout(function() {
	                   if (resize()) resize.tim = null;
	              }, 250);
};

window.onresize = doresize;
