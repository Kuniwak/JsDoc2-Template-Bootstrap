/** Handle the creation of HTML links to documented symbols.
	@constructor
*/
function Link() {
	this.alias = "";
	this.src = "";
	this.file = "";
	this.text = "";
	this.innerName = "";
	this.classLink = false;
	this.targetName = "";
	this.isItalic = false;
	this.isBold = false;
	this.col = "";
	this.className = "";
	this.cssStyle = "";
	this.memberOf = "";
	this.ttl = "";
	this.nm = "";
	this.atrId = "";

	this.target = function(targetName) {
		if (defined(targetName)) this.targetName = targetName;
		return this;
	}
	this.inner = function(inner) {
		if (defined(inner)) this.innerName = inner;
		return this;
	}
	this.withText = function(text) {
		if (defined(text)) this.text = text;
		return this;
	}
	this.toSrc = function(filename) {
		if (defined(filename)) this.src = filename;
		return this;
	}
	this.toSymbol = function(alias, memberOf) {
		if (defined(alias)) this.alias = String(alias);
		if (defined(memberOf)) this.memberOf = String(memberOf);
		return this;
	}
	this.toClass = function(alias) {
		this.classLink = true;
		return this.toSymbol(alias);
	}
	this.toFile = function(file) {
		if (defined(file)) this.file = file;
		return this;
	}

	this.italic = function(mode) {
		this.isItalic = (mode!==false);
		return this;
	};

	this.bold = function(mode) {
		this.isBold = (mode!==false);
		return this;
	};

	this.color = function(col) {
		this.col = col;
		return this;
	};

	this.cssClass = function(className) {
		if (defined(className)) this.className = className;
		return this;
	};

	this.style = function(cssStyle) {
		if (defined(cssStyle)) this.cssStyle = cssStyle;
		return this;
	};

	this.title = function(ttl) {
		this.ttl = ttl;
		return this;
	};

	this.name = function(nm) {
		this.nm = nm;
		return this;
	};

	this.id = function(id) {
		this.atrId = id;
		return this;
	};

	this.toString = function() {
		var linkString;
		var thisLink = this;

		if (this.alias) {
			linkString = this.alias.replace(/(^|[^a-z$0-9_#.:^-])([|a-z$0-9_#.:^-]+)($|[^a-z$0-9_#.:^-])/i,
				function(match, prematch, symbolName, postmatch) {
					var symbolNames = symbolName.split("|");
					var links = [];
					for (var i = 0, l = symbolNames.length; i < l; i++) {
						thisLink.alias = symbolNames[i];
						links.push(thisLink._makeSymbolLink(symbolNames[i]));
					}
					return prematch+links.join("|")+postmatch;
				}
			);
		}
		else if (this.src) {
			linkString = thisLink._makeSrcLink(this.src);
		}
		else if (this.file) {
			linkString = thisLink._makeFileLink(this.file);
		}

		return linkString;
	}
}

/** prefixed for hashes */
Link.hashPrefix = "";

/** Appended to the front of relative link paths. */
Link.base = "";

Link.symbolNameToLinkName = function(symbol) {
	var linker = "";
	if (symbol.isStatic) linker = ".";
	else if (symbol.isInner) linker = "-";

	if (symbol.isEvent) linker += "event:";

	return Link.hashPrefix+linker+symbol.name;
}

/** Create a link to another symbol. */
Link.prototype._makeSymbolLink = function(alias) {
	var linkBase = Link.base+publish.conf.symbolsDir;
	var linkTo = Link.symbolSet.getSymbol(alias);
	var linkPath;

	// is it an internal link?
	if (alias.charAt(0) == "#") {
		var linkPath = alias;
	}
	// if there is no symbol by that name just return the name unaltered
	else if (!linkTo) {
		return this.text || alias;
	}
	// it's a symbol in another file
	else {
		if (!linkTo.is("CONSTRUCTOR") && !linkTo.isNamespace) { // it's a method or property
			var memberOf = this.memberOf?this.memberOf:linkTo.memberOf;
			linkPath =
				(Link.filemap)? Link.filemap[memberOf]
				:
				escape(memberOf) || "_global_";
			linkPath += publish.conf.ext + "#" + Link.symbolNameToLinkName(linkTo);

			if (this.ttl=="") this.ttl = linkTo.summarizedDesc || linkTo.desc;
		}
		else {
			linkPath = (Link.filemap)? Link.filemap[linkTo.alias] : escape(linkTo.alias);
			linkPath += publish.conf.ext;// + (this.classLink? "":"#" + Link.hashPrefix + "constructor");

			if (this.ttl=="") this.ttl = linkTo.summarizedClassDesc || linkTo.classDesc;
		}
		linkPath = linkBase + linkPath;
	}

	var linkText = this.text || alias;
	var link = {linkPath: linkPath, linkText: linkText, linkInner: (this.innerName? "#"+this.innerName : "")};

	if (typeof JSDOC.PluginManager != "undefined") {
		JSDOC.PluginManager.run("onSymbolLink", link);
	}

	return this._makeAnchorTag(link.linkPath+link.linkInner, link.linkText);
}

/** Create a link to a source file. */
Link.prototype._makeSrcLink = function(srcFilePath) {
	// transform filepath into a filename
	var srcFile = srcFilePath.replace(/\.\.?[\\\/]/g, "").replace(/[:\\\/]/g, "_");
	var outFilePath = Link.base + publish.conf.srcDir + srcFile + publish.conf.ext;

	if (!this.text) this.text = FilePath.fileName(srcFilePath);

	if (this.ttl=="") {
		var fileSymbol = Link.symbolSet.getSymbol(srcFilePath);
		if (fileSymbol) {
			this.ttl = fileSymbol.dispPath || fileSymbol.alias;
			if (fileSymbol.summarizedDesc!="") {
				this.ttl += " - " + fileSymbol.summarizedDesc;
			}
			else if (fileSymbol.desc!="") {
				this.ttl += " - " + fileSymbol.desc;
			}
		}
	}
	
	var linkInner = this.innerName? "#"+this.innerName : "";

	return this._makeAnchorTag(outFilePath+linkInner, this.text);
}

/** Create a link to a source file. */
Link.prototype._makeFileLink = function(filePath) {
	var outFilePath =  Link.base + filePath;

	if (!this.text) this.text = filePath;

	return this._makeAnchorTag(outFilePath, this.text);
}


Link.prototype._makeAnchorTag = function(outFilePath, text) {
	var attrs = [];
	attrs.push("href='"+outFilePath+"'");

	if (this.targetName!="") attrs.push("target='"+this.targetName+"'");
	if (this.className!="")  attrs.push("class='"+this.className+"'");
	if (this.ttl!="")        attrs.push("title='"+escapeHTML(this.ttl)+"'");
	if (this.nm!="")         attrs.push("name='"+this.nm+"'");
	if (this.atrId!="")      attrs.push("id='"+this.atrId+"'");

	var style = "";
	if (this.cssStyle) style += this.cssStyle+";";
	if (this.isItalic) style += "font-style:italic;";
	if (this.isBold) style += "font-weight:bold;";
	if (this.col!="") style += "color:"+this.col+";";
	if (style!="") attrs.push("style='"+style+"'");

	return "<a "+ attrs.join(" ") +">"+text+"</a>";
};

