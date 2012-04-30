var minInherit = (readCookie("aiasframe_mininhrt")=="1");
var hidePrivates = (readCookie("aiasframe_hideprvt")=="1");

window.onload = function() {
	var minInhrt = $("minimizeInrerits");
	if (minInhrt) {
		minInhrt.onclick = function() {
			minInherit = this.checked;
			updateInreritsMinimizing();
			updateCaptionDisp();

			if (window.top!=window) {
				writeCookie("aiasframe_mininhrt", (minInherit?"1":"0"), makeExpires(3), "/");
			}
		};

		minInhrt.checked = minInherit;
		updateInreritsMinimizing();
	}
	
	var hidePrivt = $("hidePrivates");
	if (hidePrivt) {
		hidePrivt.onclick = function() {
			hidePrivates = this.checked;
			updatePrivateHiding();
			updateCaptionDisp();

			if (window.top!=window) {
				writeCookie("aiasframe_hideprvt", (hidePrivates?"1":"0"), makeExpires(3), "/");
			}
			
			if (window.top.summary) {
				window.top.summary.TreeOperator.showPrivateMembers(!hidePrivates);
			}
		};

		hidePrivt.checked = hidePrivates;
		updatePrivateHiding();
	}

	updateCaptionDisp();
	makeLinkToNewWindow("../?"+symbolAlias);
	
	var hash = location.hash;
	if (hash!="") location.replace(hash);
};


function updateInreritsMinimizing() {
	var trVisibleVal = Br.isIE?"block":"table-row";
	appendCSSRules(".summaryTable tr.isInherited { display:"+ (minInherit?"none":trVisibleVal) +"}");

	var disp = getTableDisplayValue(minInherit);
	appendCSSRules("#inheritConstants { display:"+ disp +";}");
	appendCSSRules("#inheritProperties { display:"+ disp +";}");
	appendCSSRules("#inheritMethods { display:"+ disp +";}");
	appendCSSRules("#inheritEvents { display:"+ disp +";}");

	appendCSSRules("div.isInherited { display:"+ getBlockDisplayValue(!minInherit) +"}");

	updateCollapsedLinks("inheritConstants");
	updateCollapsedLinks("inheritProperties");
	updateCollapsedLinks("inheritMethods");
	updateCollapsedLinks("inheritEvents");
}

function updateCollapsedLinks(containerId) {
	var container = $(containerId);
	if (!container) return;

	var tds = container.getElementsByTagName("td");
	for (var i=0;i<tds.length;i++) {
		var links = tds[i].getElementsByTagName("a");
		for (var j=0;j<links.length;j++) {
			link = links[j];
			if (minInherit) {
				link.id = link.id.replace(/^\*+/,"");
			}
			else {
				link.id = link.id.replace(/^/,"***");
			}
		}
	}
}

function updatePrivateHiding() {
	var trVisibleVal = Br.isIE?"block":"table-row";
	appendCSSRules(".summaryTable tr.isPrivate { display:"+ (hidePrivates?"none":trVisibleVal) +"}");

	appendCSSRules("div.isPrivate { display:"+ getBlockDisplayValue(!hidePrivates) +"}");
}

function updateCaptionDisp() {
	var constCnt = constCntTotal;
	if (minInherit) constCnt -= constCntInterit;
	if (hidePrivates) constCnt -= constCntPrivate;
	var visible = (constCnt > 0);
	appendCSSRules("#constantSummary { display:"+ getTableDisplayValue(visible) +"}");
	appendCSSRules("#constantDetail { display:"+ getBlockDisplayValue(visible) +"}");

	var propCnt = propCntTotal;
	if (minInherit) propCnt -= propCntInterit;
	if (hidePrivates) propCnt -= propCntPrivate;
	var visible = (propCnt > 0);
	appendCSSRules("#propertySummary { display:"+ getTableDisplayValue(visible) +"}");
	appendCSSRules("#propertyDetail { display:"+ getBlockDisplayValue(visible) +"}");

	var methodCnt = methodCntTotal;
	if (minInherit) methodCnt -= methodCntInterit;
	if (hidePrivates) methodCnt -= methodCntPrivate;
	var visible = (methodCnt > 0);
	appendCSSRules("#methodSummary { display:"+ getTableDisplayValue(visible) +"}");
	appendCSSRules("#methodDetail { display:"+ getBlockDisplayValue(visible) +"}");

	var eventCnt = eventCntTotal;
	if (minInherit) eventCnt -= eventCntInterit;
	if (hidePrivates) eventCnt -= eventCntPrivate;
	var visible = (eventCnt > 0);
	appendCSSRules("#eventSummary { display:"+ getTableDisplayValue(visible) +"}");
	appendCSSRules("#eventDetail { display:"+ getBlockDisplayValue(visible) +"}");
}

function getTableDisplayValue(mode) {
	return mode?(Br.isIE?"block":"table"):"none";
}

function getBlockDisplayValue(mode) {
	return mode?"block":"none";
}

