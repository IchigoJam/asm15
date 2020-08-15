//GLOBAL
var NOTOPCODE = 0x100000000 + 0;
var YET       = 0x100000000 + 1;
var COMMENT   = 0x100000000 + 2;
var EMPTYLINE = 0x100000000 + 3;
var ASMERR    = 0x100000000 + 4;
var LABEL     = 0x100000000 + 5;

var lbl_dict = {};
// var lbl_align4 = [];

var token_dict = {
"rlist":"\\{(.+)\\}",
"label":"(@.+)",
"h":"r(8|9|10|11|12|13|14|15)",
"reg":"r([0-7])",
"push":"push",
"pop":"pop",
"ldm":"ldm",
"stm":"stm",
"!":"\\!",
"=":"=",
"<<":"<<",
">>":">>",
"+":"\\+",
"ofs":"([\\+\\-]{1}.+)",
"|":"\\|",
//"n":"((?:\\-|0b|0x)?[0-0a-f]{1,8})",
"n":"(.+)",
"-":"\\-",
"&":"&",
"^":"\\^",
"not":"(?:\\~|not)",

"cond":"(eq|ne|cs|cc|mi|pl|vs|vc|hi|ls|ge|lt|gt|le|al|hs|lo)",

"*":"\\*",
"if":"if",
"goto":"goto",
"call":"call",
"gosub":"gosub", // for 後方互換
"ret":"ret",
"":"",
"[":"\\[",
"]":"\\]",
//"bl":"([b|l]?)",
"w":"w",
"l":"l",
"s":"s",
"c":"c",
"0":"0",
"data":"data",
"pc":"pc",
"sp":"sp",
"cpsid":"cpsid",
"cpsie":"cpsie",
"nop":"nop",
"wfi":"wfi",
",":"\,",

"bic":"bic",
"asr":"asr",
"ror":"ror",
"revsh":"revsh",
"rev16":"rev16",
"rev":"rev",
"adc":"adc",
"sbc":"sbc",
"(":"\\(",
")":"\\)",

};

function patfactory(s) {
	s = s.split(" ");
	var p = [ "^" ];
	for (var i = 0; i < s.length; i++) {
		p.push(token_dict[s[i].toLowerCase()]);
	}
	p.push("$");
	var s = p.join("");
	return RegExp(s);
}
var b_dict={};
var n_dict={};
function rlist(){
	var pat=/r([0-7])\-r([0-7])/;
	var f=function(d,pc){
		var ret=0,r,i,j,a,rs=d.split(",");
		for(i=0;i<rs.length;i++){
			r=rs[i];
			a=r.match(pat)
			if(a){
				for(j=parseInt(a[1]);j<=parseInt(a[2]);j++){
					ret|=(1<<j);
				}
			}else if (r.charAt(0)=="r"){
				r=parseInt(r.slice(1));
				if(r>=0&&r<8){
					ret|=(1<<r);
				}else if (r==14||r==15){
					ret|=0x100;
				}else{
					return ASMERR
				}
			} else if (r=="pc" || r=="lr"){
				ret|=0x100;
			}
		}
		return ret;
	}
	return f;
}
function lb(pc){

}
function n(bits, s, ofs, div, align4) {
	//dat bit shift
	ofs=(ofs!=undefined)?ofs:0;
	div=(div!=undefined)?div:0;
	var mask=Math.pow(2,bits)-1;
	var mx=Math.pow(2,bits-1)-1;
	var mn=-Math.pow(2,bits-1);
	if (mask < 1)
		mask = 0;
	var f = function(d, pc){
		var ret = d.match(/@\w+/g);
		if (ret != null) {
			for (var i = 0; i < ret.length; i++) {
				var lbl = ret[i];
				if (lbl in lbl_dict) {
					var adl = lbl_dict[lbl];
					var ad = adl - (pc & 0x0fffffffe);
					if (align4 && ad < 0) {
						throw new Error("can't use minus address");
					}
					if (align4) { // 追加 r0=[sp+n] のとき (バグ修正)
						//lbl_align4.push(lbl);
						if (adl % 4 == 2) {
							ad += 2;
						}
						if (pc % 4 == 2) {
							ad += 2;
						}
					}
					rel = ad >> div; // 0x0fffffffc -> 0x0fffffffe
//					alert(lbl_dict[lbl].toString(16) + " " + pc.toString(16) + " " + div + " " + ((pc & 0x0fffffffe)) + " " + lbl + " " + rel);
					if (rel > mx || rel < mn) {
						return ASMERR
					}
					d = d.replace(lbl, rel, "g");
				} else {
					return YET;
				}
			}
		}
		d = pint(d) + ofs;
		return (d & mask) << s;
	}
	return f;
}
function b(bits, s, ofs, chk) {
	//dat bit shift,ofs
	ofs = (ofs != undefined) ? ofs : 0;
	var mask = Math.pow(2, bits) - 1;
	if (mask < 1)
		mask = 0;
//console.log(bits,s,ofs);
	var f = function(d, pc) {
		//console.log(bits,s,ofs);
		d = pint(d);
		if (chk) {
			if (d & ~mask) {
				throw new Error("over!");
			}
		}
		return (d & mask) << s;
	}
	return f;
}
function bu(bits, s, ofs) {
	return b(bits, s, ofs, true);
}
function bl(bits,s,ofs){
	//dat bit shift,ofs
	ofs=(ofs!=undefined)?ofs:0;
	var mask=Math.pow(2,bits)-1;
	if (mask<1)
		mask=0;
	var f = function(d,pc){
//		console.log("d",d);
		d={"":1,undefined:1,"w":0,"b":1}[d];
		d=parseInt(d);

		return (d&mask)<<s;
	}
	return f;
}
function cond(ofs, invert) {
	var f = function(d, pc) {
		if (d == "hs") {
			d = "cs";
		} else if (d == "lo") {
			d = "cc";
		}
		var n = "eq|ne|cs|cc|mi|pl|vs|vc|hi|ls|ge|lt|gt|le|al".indexOf(d) / 3;
		if (invert)
			n ^= 1;
		return n << ofs;
	};
	return f;
}
function build_m(f, ar, pc) {
	var op = f[1];
	for (var i = 1; i < ar.length; i++) {
		//console.log(i + " " + ar[i]);
		var _op = f[i + 1](ar[i], pc);
		if (_op >= NOTOPCODE) {
			return _op;
		} else {
			op = op | _op;
		}
	}
	return 0xffff & op;
}

var cmdlist = [
//special
["reg = rev ( reg )",0xba00,b(3,0),b(3,3)],
["reg = rev16 ( reg )",0xba40,b(3,0),b(3,3)],
["reg = revsh ( reg )",0xbac0,b(3,0),b(3,3)],
["reg = asr ( reg , n )",0x1000,b(3,0),b(3,3),b(5,6,0)],
["asr reg , reg",0x4100,b(3,0),b(3,3)],
["ror reg , reg",0x41c0,b(3,0),b(3,3)],
["bic reg , reg",0x4380,b(3,0),b(3,3)],
["adc reg , reg",0x4140,b(3,0),b(3,3)],
["reg + = reg + c",0x4140,b(3,0),b(3,3)],
["sbc reg , reg",0x4180,b(3,0),b(3,3)],
["reg - = reg + ! c",0x4180,b(3,0),b(3,3)],

//jmp
["if 0 goto n",0xd000,n(8,0,-2,1)],
["if ! 0 goto n",0xd100,n(8,0,-2,1)],
["if cond goto n",0xd000,cond(8,0),n(8,0,-2,1)],
["if ! cond goto n",0xd000,cond(8,1),n(8,0,-2,1)],
["goto reg",0x4700,b(3,3)],
["goto h",0x4740,b(3,3)],
["call reg",0x4780,b(3,3)], // 追加
["call h",0x47C0,b(3,3)], // 追加
["gosub reg",0x4780,b(3,3)],
["gosub h",0x47C0,b(3,3)], // 追加 GOSUB == CALL
["goto n",0xe000,n(11,0,-2,1)], // div 2->1

//sp
["sp + = n",0xb000,bu(7,0,0)],
["sp - = n",0xb080,bu(7,0,0)],
["reg = sp + n",0xa800,b(3,8),bu(8,0,0)],
["reg = [ sp + n ] l",0x9800,b(3,8),bu(8,0)],
["[ sp + n ] l = reg",0x9000,b(8,0),bu(3,8)],

//memory
["reg = [ reg + reg ]",  0x5c00,b(3,0),b(3,3),b(3,6),bl(1,10,0)],
["reg = [ reg + reg ] c",0x5600,b(3,0),b(3,3),b(3,6),bl(1,10,0)], // 追加
["reg = [ reg + reg ] w",0x5a00,b(3,0),b(3,3),b(3,6),bl(1,10,0)],
["reg = [ reg + reg ] s",0x5e00,b(3,0),b(3,3),b(3,6),bl(1,10,0)], // 追加
["reg = [ reg + reg ] l",0x5800,b(3,0),b(3,3),b(3,6),bl(1,10,0)],
//["reg = [ reg + reg ] bl",0x5800,b(3,0),b(3,3),b(3,6),bl(1,10,0)],
["[ reg + reg ] = reg",  0x5400,b(3,3),b(3,6),b(3,0),bl(1,10,0)],
["[ reg + reg ] w = reg",0x5200,b(3,3),b(3,6),b(3,0),bl(1,10,0)],
["[ reg + reg ] l = reg",0x5000,b(3,3),b(3,6),b(3,0),bl(1,10,0)],
//["[ reg + reg ] bl = reg",0x5000,b(3,3),b(3,6),b(3,0),bl(1,10,0)],

["reg = [ reg + n ]",  0x7800,b(3,0),b(3,3),bu(5,6,0)],
["reg = [ reg + n ] w",0x8800,b(3,0),b(3,3),bu(5,6,0)],
["reg = [ reg + n ] l",0x6800,b(3,0),b(3,3),bu(5,6,0)],
//["reg = [ reg + n ] bl",0x6800,b(3,0),b(3,3),b(5,6,0),bl(1,12,0)],
["reg = [ reg ]",  0x7800,b(3,0),b(3,3)],
["reg = [ reg ] w",0x8800,b(3,0),b(3,3)],
["reg = [ reg ] l",0x6800,b(3,0),b(3,3)],

["[ reg + n ] = reg",   0x7000,b(3,3),bu(5,6,0),b(3,0),bl(1,12,0)], // 追加
["[ reg + n ] w = reg", 0x8000,b(3,3),bu(5,6,0),b(3,0),bl(1,12,0)],
["[ reg + n ] l = reg", 0x6000,b(3,3),bu(5,6,0),b(3,0),bl(1,12,0)], // 追加
//["[ reg + n ] bl = reg",0x6000,b(3,3),b(5,6,0),b(3,0),bl(1,12,0)],
["[ reg ] = reg",   0x7000,b(3,3),b(3,0),bl(1,12,0)],
["[ reg ] w = reg", 0x8000,b(3,3),b(3,0),bl(1,12,0)],
["[ reg ] l = reg", 0x6000,b(3,3),b(3,0),bl(1,12,0)],


["reg = reg << n",0x0,b(3,0),b(3,3),bu(5,6)],
["reg = reg >> n",0x0800,b(3,0),b(3,3),bu(5,6)],
["reg = reg + reg",0x1800,b(3,0),b(3,3),b(3,6)],
["reg = reg - reg",0x1a00,b(3,0),b(3,3),b(3,6)],
["reg = reg + n",0x1c00,b(3,0),b(3,3),bu(3,6)],
["reg = reg - n",0x1e00,b(3,0),b(3,3),bu(3,6)],
["reg & = reg",0x4000,b(3,0),b(3,3)],
["reg ^ = reg",0x4040,b(3,0),b(3,3)],
["reg << = reg",0x4080,b(3,0),b(3,3)],
["reg >> = reg",0x40c0,b(3,0),b(3,3)],
["reg = - reg",0x4240,b(3,0),b(3,3)],
["reg + = reg",0x4400,b(3,0),b(3,3)],
["reg + = h",0x4440,b(3,0),b(3,3)],
["h + = reg",0x4480,b(3,0),b(3,3)],
["h + = h",0x44C0,b(3,0),b(3,3)],
["reg | = reg",0x4300,b(3,0),b(3,3)],
["reg * = reg",0x4340,b(3,0),b(3,3)],
["reg & = not reg",0x4380,b(3,0),b(3,3)],
["reg = not reg",0x43c0,b(3,0),b(3,3)],
["reg + = n",0x3000,b(3,8),bu(8,0)],
["reg - = n",0x3800,b(3,8),bu(8,0)],
//cmp
["reg - reg",0x4280,b(3,0),b(3,3)],
["reg - h",0x4540,b(3,0),b(3,3)],
["h - reg",0x4580,b(3,0),b(3,3)],
["h - h",0x45C0,b(3,0),b(3,3)],
["reg & reg",0x4200,b(3,0),b(3,3)],
["reg - n",0x2800,b(3,8),bu(8,0)],
//ret
["ret",0x4770],
//let
["h = h",0x46c0,b(3,0),b(3,3)],
["h = reg",0x4680,b(3,0),b(3,3)],
["reg = h",0x4640,b(3,0),b(3,3)],
["reg = reg",0x4600,b(3,0),b(3,3)],

["reg = pc + n",0xa000,b(3,8),n(8,0,-1,2)],
["reg = label",0xa000,b(3,8),n(8,0,-1,2,1)], // align4
["reg = [ n ] l",0x4800,b(3,8,0),n(8,0,-1,2,1)], // align4

["reg = n",0x2000,b(3,8),bu(8,0,0)],
["push rlist",0xb400,rlist()],
["pop rlist",0xbc00,rlist()],

["ldm reg , rlist",0xc800,b(3,8),rlist()], // add
["stm reg , rlist",0xc000,b(3,8),rlist()], // add

//other
["cpsid",0xB672],
["cpsie",0xB662],
["wfi",0xbf30],
["nop",0],

];

var patlist = [];
for (var i = 0; i < cmdlist.length; i++){
	patlist.push(patfactory(cmdlist[i][0]));
}

//
function getSize(lines, outlist){
	var p,p0,p1;
	var bas="",i,line,out,nln;
	var skips={undefined:true,LABEL:true,COMMENT:true,NOTOPCODE:true};
	var n = 0;
	for (var i = 0; i < outlist.length; i++) {
		out=outlist[i];
		l=out[0];
		a=out[1];
		p=out[2];
		line=lines[l];

		if(p==EMPTYLINE){
			continue;
		} else if(p===undefined||p===null||p===false||p>=NOTOPCODE){
		} else {
//			bas += "[" + n + "]=`" + zero2w(p) + "\n";// + " '" + line + "\n";
//			bas += "[" + n + "]=`" + zero2(p >> 8) + " " + zero2(p & 0xff) + " :'" + line + "\n";
			n++;
		}
	}
	return n * 2;
}

function cutComment(s) {
	var n = s.indexOf("'");
	if (n < 0)
		return s;
	return s.substring(0, n);
};

function asmln(ln, prgctr) {
	ln = cutComment(ln);
	//ln=ln.toLowerCase().replace(/\s/g,"");
	for (var j = 0; j < patlist.length; j++) {
		var m = ln.match(patlist[j]);
		if (m) {
			// console.log(patlist[j] + " " + m);
			var p = build_m(cmdlist[j], m, prgctr);
			return p;
		}
	}
	return undefined;

}
function pint(s) {
//	try {
		var orgs = s;
		var n = s.indexOf("'");
		if (n >= 0) {
			s = s.substring(0, n);
		}
		s = s.replace(/#/g,"0x").replace(/`/g,"0b")
		return parseInt(eval(s));
//	} catch (e) {
//		alert("err: " + orgs);
//		return null;
//	}
}

function pdat(ln,pc){
	var dtype=ln.charAt(4),start;
	var sz,sz_dict={"b":1,"w":2,"l":4};
	if (dtype in sz_dict){
		sz=sz_dict[dtype];
		start=5;
	}else{
		sz=1;
		start=4;
	}
	
	ln=ln.replace(/#/g,"0x").replace(/`/g,"0b")
	var dlist=ln.slice(start).split(",")
	var i,d,ret=[];
	var adr=0;
	var msk=Math.pow(2,8*sz)-1;
	for(i=0;i<dlist.length;i++){
		d=pint(dlist[i]);
		ret.push(d&msk);
	}
				
	var _ret = ret;
	ret = [];

	//align
	if (pc % 4 == 2) {
		ret.unshift(0);
	};
	if (sz==1) {
		if(_ret.length%2){
			_ret.push(0);
		};
		for(i=0;i<_ret.length;i+=2){
			ret.push(_ret[i]|(_ret[i+1]<<8));
		}
	} else if (sz == 2){
		for(i=0;i<_ret.length;i++) {
			ret.push(_ret[i]);
		}
	} else if (sz == 4){
		for (i = 0; i < _ret.length; i++){
			ret.push(_ret[i] & 0xffff);
			ret.push((_ret[i] >> 16) & 0xffff);
		}
	}
	return ret

}
function sublbl(d,pc){
	var ret,lbl,i;
	ret=d.match(/@\w+/g);
	if (ret!=null){
		for(i=0;i<ret.length;i++){
			lbl = ret[i];
			if (lbl in lbl_dict) {
				rel = lbl_dict[lbl] - pc;
				d = d.replace(lbl, rel, "g")
			} else {
				return YET;
			}
		}
	}
	d = pint(d);
	return d;
}
function gsb(d,pc) {
	var rel = sublbl(d,pc);
	var ret;
	if (rel == YET) {
		ret = YET;
	} else {
		rel = rel - 4;
		var h = (rel >> 12) & 0x7ff;
		var l = (rel >> 1)  & 0x7ff;
		ret = [0xf000 | h, 0xf800 | l];
	}
	return ret;
}

var bas = "";
var outlist = [];
function assemble() {
	lbl_dict = {};
	//lbl_align4 = [];
	outlist = [];
	var prgctr = 0;
	dom_src=document.getElementById("textarea1");
	dom_fmt=document.getElementById("selfmt");
	dom_hex=document.getElementById("textarea2");
	dom_err=document.getElementById("textarea3");
	dom_adr=document.getElementById("txtadr");
	var fmt = dom_fmt.value;
	var fm2b = fmt_dict[fmt];
	var s = dom_src.value;
	s = s.replace(/\/\*([^*]|\*[^\/])*\*\//g,"");
	var lines = s.split("\n");
	var j,line,m,p,p1,p2;
	var lno;
	dom_hex.innerHTML=""
	prgctr=pint(dom_adr.value);
	var startadr = prgctr;
	bas="";

	var orglines = [];
	for (var i = 0; i < lines.length; i++) {
		orglines.push(lines[i]);
	}
	
	for (var i = 0; i < lines.length; i++) {
		line = lines[i].toLowerCase().replace(/\s/g,"");
		lines[i] = line;

		if (line.charAt(0) == "@") {
			/*
			console.log("@put ", line, prgctr, lbl_align4);
			if (lbl_align4.indexOf(line) >= 0) {
					if (prgctr % 4 == 2) {
					outlist.push([i, prgctr, 0]);
					prgctr += 2;
				}
			}
			*/
			lbl_dict[cutComment(line)] = prgctr;
			outlist.push([i,prgctr,LABEL]);
			continue;
		} else if (line.charAt(0) == "'" || line.slice(0,3) == "rem"){
			outlist.push([i,prgctr,COMMENT]);
			continue;
		} else if (line.slice(0,4) == "data") {
			dlist = pdat(line, prgctr);
			for (j = 0; j < dlist.length; j++){
				outlist.push([i, prgctr, dlist[j]]);
				prgctr += 2;
			}
			continue;
		} else if (line == "") {
			outlist.push([i,prgctr,EMPTYLINE]);
			continue;
		} else {
			try {
				p = asmln(line, prgctr);
				
				outlist.push([ i, prgctr, p ]);
				if (p != undefined) {
					prgctr += 2;
				} else if (line.slice(0,4) == "call" || line.slice(0,5) == "gosub") {
					p = gsb(line.charAt(0) == 'c' ? line.slice(4) : line.slice(5), prgctr);
					if (p == YET) {
						p1 = YET;
						p2 = YET;
					} else {
						p1 = p[0];
						p2 = p[1];
					}
					outlist.push([i, prgctr, p1]);
					outlist.push([i, prgctr + 2, p2]);
					prgctr += 4;
				} else {
					throw line; // alert("asm error: " + line);
				}
			} catch (e) {
				alert("asm error in " + (i + 1) + "\n" + orglines[i] + "\n" + e);
			}
		}
	}
	
	for (i = 0; i < outlist.length; i++){
		lno = outlist[i][0];
		prgctr = outlist[i][1];
		p = outlist[i][2];
		line = lines[lno].toLowerCase();
//		console.log(lines[i] + " " + prgctr + " " + p.toString(16));
		
		if (p >= NOTOPCODE) {
		}
		if (p == YET) {
			if (line.slice(0,4) == "call" || line.slice(0,5) == "gosub") {
				p = gsb(line.charAt(0) == 'c' ? line.slice(4) : line.slice(5), prgctr);
				p1=p[0];
				p2=p[1];
				outlist[i]=[lno,prgctr,p1];
				outlist[i+1]=[lno,prgctr+2,p2];
				i++;
				
				if (p1 == undefined) {
					alert("label not found in " + lno + "\n" + orglines[lno]);
				}
			} else {
				p = asmln(line,prgctr);
				outlist[i] = [ lno, prgctr, p ];
				
				if (outlist[i][2] == YET) {
					alert("label not found in " + lno + "\n" + orglines[lno]);
				}
			}
		}
	}
	//console.log(outlist);
	bas = fm2b(lines, outlist);
	dom_hex.value = bas;
	binsize.textContent = getSize(lines, outlist);
	if (dom_hex.textContent==bas)
		return;
	dom_hex.textContent = bas;
	if (dom_hex.textContent==bas)
		return;
	dom_hex.innerText=bas;
	if (dom_hex.innerText==bas)
		return;
	dom_hex.innerHTML=bas;
	if (dom_hex.innerHTML==bas)
		return;
}

function example() {
	var dom_src = document.getElementById("textarea1");
	var dom_ex = document.getElementById("selex");
	var exname = dom_ex.value;
	if (!exname) {
		return false;
	}
	fetch("samples/" + exname + ".asm")
		.then(res => res.text())
		.then(text => dom_src.value = text);
}

