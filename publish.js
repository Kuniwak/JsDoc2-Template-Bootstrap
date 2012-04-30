var orgEnc = IO.encoding;
IO.setEncoding("utf-8");

eval(IO.readFile(JSDOC.opt.t + (JSDOC.opt.t.lastIndexOf("/")!=0?"/":"") + "lib/publish.js"));

IO.setEncoding(orgEnc);

