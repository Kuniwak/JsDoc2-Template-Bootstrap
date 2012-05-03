/**
 * ソースコードのパース完了後に、JsDoc Toolkitから自動的に呼び出される関数。
 * @param {JSDOC.SymbolSet} symbolSet シンボルのコレクション
 */
function publish(symbolSet) {

	//publish関数のプロパティにsymbolSetを追加。
	publish.symbolSet = symbolSet;

	//ソースコードの出力しない場合、リンク化せずにファイル名の表示だけを行う。
	if (JSDOC.opt.s && defined(Link) && Link.prototype._makeSrcLink) {
		Link.prototype._makeSrcLink = function(srcFilePath) {
			srcFilePath = srcFilePath.replace(/\/\\/g, "/").replace(/\\/g, "/");
			return "&lt;"+srcFilePath+"&gt;";
		}
	}

	//出力先のディレクトリ階層を作成する。
	IO.mkPath((publish.conf.outDir+"symbols/src").split("/"));
	IO.mkPath((publish.conf.outDir+"js").split("/"));

	//LinkクラスにsymbolSetを設定し、リンク作成時にシンボルの詳細情報を参照できるようにする。
	Link.symbolSet = symbolSet;

	//テンプレートオブジェクトを生成する。
	try {
		var classTemplate        = templateFactory(publish.conf.templatesDir+"class.tmpl");
		var summaryTemplate      = templateFactory(publish.conf.templatesDir+"summary.tmpl");
		var indexTemplate        = templateFactory(publish.conf.templatesDir+"index.tmpl");
		var classesIndexTemplate = templateFactory(publish.conf.templatesDir+"classesindex.tmpl");
		var filesIndexTemplate   = templateFactory(publish.conf.templatesDir+"filesindex.tmpl");
		var overviewTemplate     = templateFactory(publish.conf.templatesDir+"overview.tmpl");
	}
	catch(e) {
		print("Couldn't create the required templates: "+e);
		quit();
	}

	//概要ページのファイルシンボルを作成する。
	var overviewSymbol;
	if (JSDOC.opt.D.overview) {
		JSDOC.opt.D.overview = JSDOC.opt.D.overview.replace(/^([a-zA-Z])\?([\\\/].*)/,"$1:$2");
		overviewSymbol = createOverviewSymbol(JSDOC.opt.D.overview);

		//各ページの処理が参照する概要ページ存在フラグを設定
		publish.hasOverview = true;
	}

	//ドキュメントタイトルを決定する。
	if (JSDOC.opt.D.title) {
		publish.docTitle = JSDOC.opt.D.title;
	}
	else if (overviewSymbol && overviewSymbol.appName) {
		publish.docTitle = overviewSymbol.appName + " " + Kw.index.title;
	}
	else {
		publish.docTitle = Kw.index.title;
	}
	
	//カスタムCSSファイルが指定されていれば、出力先パス文字列を作成する。
	if (JSDOC.opt.D.css) {
		publish.hasUserCSS = true;
		JSDOC.opt.D.css = JSDOC.opt.D.css.replace(/^([a-zA-Z])\?([\\\/].*)/,"$1:$2");
		if (!IO.exists(JSDOC.opt.D.css)) {
			JSDOC.opt.D.css = publish.conf.templatesDir+JSDOC.opt.D.css;
			if (!IO.exists(JSDOC.opt.D.css)) publish.hasUserCSS = false;
		}
	}
	
	//全シンボルの配列を取得する。
	var symbols = symbolSet.toArray();

	//ファイルシンボルを取得する。
	//これらはソース内でファイルに対してDocコメントが記述された場合に作成されている。
	var allFiles = [];
 	var srcDir = publish.conf.outDir + "symbols/src/";
	var files = JSDOC.opt.srcFiles;
	for (var i=0,l=files.length; i<l; i++) {
		var fileAlias = files[i];

		var symbol = symbolSet.getSymbol(fileAlias);
		if (!symbol) {
			//全ファイル分のシンボルを作成し、symbolSetに追加する。
			symbol = new JSDOC.Symbol(files[i], [], "FILE", new JSDOC.DocComment("/** */"));
			symbolSet.addSymbol(symbol);
		}

		allFiles.push(symbol);
		setFileSymbolOutData(symbol);

		//ハイライト済みのソースファイルを出力する。
		makeSrcFile(fileAlias, srcDir);
 	}

	//ファイル名でソート
	allFiles = allFiles.sort(makeSortby("fileName"));


 	//全クラス（と名前空間）シンボルの配列を取得する。
 	var classes = symbols.filter(function($){return ($.is("CONSTRUCTOR") || $.isNamespace)})
 	                     .sort(makeSortby("alias"));

	//大文字小文字を区別しないファイルシステムで、クラス詳細ページのファイル名が区別されるようにする。
	if (JSDOC.opt.u) {
		var filemapCounts = {};
		Link.filemap = {};
		for (var i=0,l=classes.length; i<l; i++) {
			var cls = classes[i];
			var lcAlias = cls.alias.toLowerCase();

			if (!filemapCounts[lcAlias]) {
				filemapCounts[lcAlias] = 1;
			}
			else {
				filemapCounts[lcAlias]++;
			}

			Link.filemap[cls.alias] =
				(filemapCounts[lcAlias] > 1)?
				lcAlias+"_"+filemapCounts[lcAlias] : lcAlias;
		}
	}

	//クラス詳細ページの出力に合わせ、リンクのベースパスを変更する。
	Link.base = "../";

	//クラスシンボルに出力用のデータを付加する。
	classes.forEach(setClassSymbolOutData);
//	var sorter = makeSortby("alias");
//	classes.filter(function($){ return $.isNamespace }).forEach(function($){
//		$.out.classes = $.out.classes.sort(sorter);
//		$.out.namespaces = $.out.namespaces.sort(sorter);
//	});

	//クラス詳細ページを出力する。
	for (var i = 0, l = classes.length; i < l; i++) {
		var symbol = classes[i];
		var output = classTemplate.process(symbol);
		var fileName = (JSDOC.opt.u? Link.filemap[symbol.alias] : symbol.alias) + publish.conf.ext;

		IO.saveFile(publish.conf.outDir+"symbols/", fileName, output);
	}

	//リンクのベースパスを元に戻す。
	Link.base = "";

	//クラスエイリアスの配列を表す文字列を作成する。
	//このデータは出力後のJSでクラスリストとして使用されるために各ページに埋め込まれる。
	publish.classAliasArrayString = makePropertyValueArray(classes, "alias");

	//概要ページを出力する。
	if (overviewSymbol) {
		var overview = overviewTemplate.process(overviewSymbol);
		IO.saveFile(publish.conf.outDir, "overview"+publish.conf.ext, overview);
	}

	//サマリページを出力する。
	var summary = summaryTemplate.process(classes);
	IO.saveFile(publish.conf.outDir, "summary"+publish.conf.ext, summary);

	//サマリページのフィルタ機能で利用する、シンボルのオブジェクトリテラルを出力する。
	var symbolObjects = makeSymbolObjectsString(classes);
	IO.saveFile(publish.conf.outDir+"js/", "symbolobjects.js", symbolObjects);

	//クラス一覧ページを作成する。
	var classesIndex = classesIndexTemplate.process(classes);
	IO.saveFile(publish.conf.outDir, "classesindex"+publish.conf.ext, classesIndex);

	//ファイル一覧ページを出力
	var filesIndex = filesIndexTemplate.process(allFiles);
	IO.saveFile(publish.conf.outDir, "filesindex"+publish.conf.ext, filesIndex);

	//インデックスページを出力
	var index = indexTemplate.process();
	IO.saveFile(publish.conf.outDir, "index"+publish.conf.ext, index);

	var dstDir;

	// Output static JS files
	var jsPaths = [
			'utils.js',
			'class.js',
			'summary.js',
			'classesindex.js',
			'filesindex.js',
			'bootstrap/js/bootstrap.min.js'
		];
	var numOfJsPaths = jsPaths.length;
	var jsPath;

	dstDir = publish.conf.outDir + 'js/';
	for (var i = 0; i < numOfJsPaths; i++) {
		jsPath = jsPaths[i];
		IO.copyFile(publish.conf.templatesDir + 'static/' + jsPath, dstDir);
	}

	// Output static CSS files
	var cssPaths = [
			'common.css',
			'class.css',
			'summary.css',
			'classesindex.css',
			'filesindex.css',
			'bootstrap/css/bootstrap.min.css'
		];
	var numOfCssPaths = cssPaths.length;
	var cssPath;

	if (publish.hasOverview) {
		cssPaths.push('overview.css');
	}

	IO.mkPath((publish.conf.outDir + 'css').split('/'));
	
	dstDir = publish.conf.outDir + 'css/';
	for (var i = 0; i < numOfCssPaths; i++) {
		cssPath = cssPaths[i];
		IO.copyFile(publish.conf.templatesDir + 'static/' + jsPath, dstDir);
	}

	if (publish.hasUserCSS) {
		IO.copyFile(JSDOC.opt.D.css, publish.conf.outDir + 'css', 'user_css.css');
	}

	// Output images
	var imagePaths = [
			'images/class_symbol.gif',
			'images/constants.gif',
			'images/properties.gif',
			'images/methods.gif',
			'images/events.gif',

			'images/caption_bg.png',
			'images/desc_caption.png',
			'images/file.gif',
			'images/listicon.gif',

			'images/title_class.png',
			'images/title_staticclass.png',
			'images/title_abstractclass.png',
			'images/title_virtualclass.png',
			'images/title_namespace.png',
			'images/title_interface.png',
			'images/title_deprecated.png',

			'images/expand_btn.gif',
			'images/turn_btn.gif',

			'images/filter_bg.png',
			'images/textbox_bg.png'
		];
	var numOfImagePaths = imagePaths.length;
	var imagePath;

	IO.mkPath((publish.conf.outDir + 'images').split('/'));

	dstDir = publish.conf.outDir + 'images/';
	for (var i = 0; i < numOfImagePaths; i++) {
		imagePath = imagePaths[i];
		IO.copyFile(publish.conf.templatesDir + 'static/' + imagePath, dstDir);
	}
}

/**
 * テンプレート定義オブジェクト。ディレクトリの末尾には"/"をつけること。
 * @type Object
 */
publish.conf = {
	name:         "aias-frame",
	version:      "1.6.1",
	ext:          ".html",
	outDir:       JSDOC.opt.d || SYS.pwd+"../out/aias-frame/",
	templatesDir: JSDOC.opt.t,
	symbolsDir:   "symbols/",
	srcDir:       "symbols/src/"
};
if (publish.conf.templatesDir.lastIndexOf("/")!=0) publish.conf.templatesDir += "/";

//モジュールをロード
eval(IO.readFile(publish.conf.templatesDir + "lib/utils.js"));
eval(IO.readFile(publish.conf.templatesDir + "lib/output.js"));

//キーワードファイルを読み込む。
eval(include("keywords_"+(JSDOC.opt.D.lang?JSDOC.opt.D.lang:"ja")+".js", "utf-8"));

//カスタマイズされたLinkクラスを使用する。
eval(include("lib/Link.js", "utf-8"));
