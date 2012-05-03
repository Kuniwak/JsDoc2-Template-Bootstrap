
var PageOperator = {
	"files": null
};


PageOperator.init = function() {

	//各ファイルの開閉ボタンにイベントハンドラを設定する。
	for (var i=0;i<this.files.length;i++) {
		PageOperator._initArrowBtn(this.files[i]);
	}

	this.closeAll();
};

PageOperator._initArrowBtn = function(alias) {
	var arwBtn = aiasGetElement('arw_' + alias);
	if (!arwBtn) return;

	arwBtn.onclick = function() {
		PageOperator.openFileDesc(alias, !arwBtn.isOpened);
		arwBtn.onmouseover();
	};

	arwBtn.onmouseover = function() {
		arwBtn.className = "arrowBtn arrowBtn_"+(arwBtn.isOpened?"open":"close")+"_sel";
		return false;
	};

	arwBtn.onmouseout = function() {
		arwBtn.className = "arrowBtn arrowBtn_"+(arwBtn.isOpened?"open":"close");
		return false;
	};

	arwBtn.isOpened = false;
};

PageOperator.openFileDesc = function(alias, mode) {
	var simpleDesc = aiasGetElement('mem_smp_' + alias);
	if (!simpleDesc) return;

	simpleDesc.style.display = mode ? 'none' : 'block';
	aiasGetElement('mem_dtl_' + alias).style.display = mode ? 'block' : 'none';

	var arwBtn = aiasGetElement('arw_' + alias);
	arwBtn.isOpened = mode;
	arwBtn.className = 'arrowBtn arrowBtn_' + (mode ? 'open' : 'close');
	arwBtn.title = mode ? PageOperator.msgCloseBtn : PageOperator.msgOpenBtn;
};

PageOperator.openAll = function() {
	for (var i=0;i<PageOperator.files.length;i++) {
		PageOperator.openFileDesc(PageOperator.files[i], true);
	}

	var btn = aiasGetElement('openAllBtn');
	btn.onclick = PageOperator.closeAll;
	btn.firstChild.nodeValue = PageOperator.msgCloseAllBtn;

	return false;
};

PageOperator.closeAll = function() {
	for (var i=0;i<PageOperator.files.length;i++) {
		PageOperator.openFileDesc(PageOperator.files[i], false);
	}

	var btn = aiasGetElement('openAllBtn');
	btn.onclick = PageOperator.openAll;
	btn.firstChild.nodeValue = PageOperator.msgOpenAllBtn;

	return false;
};


window.onload = function() {
	PageOperator.init();
	makeLinkToNewWindow("./?.filesindex");
};
