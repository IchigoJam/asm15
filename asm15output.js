function zero16(x) {
	x = x & 0xff;
	var p = x.toString(16).toUpperCase();
	p = "00".substr(0, 2 - p.length) + p;
	return p;
}
function zero2(x){
	var p=x.toString(2);
	p="00000000".substr(0,8-p.length)+p;
	return p;
}
function zero2w(x){
	var p=x.toString(2);
	p="0000000000000000".substr(0,16-p.length)+p;
	return p;
}
function m2b16(lines,outlist){
	var p,p0,p1;
	var bas="",i,line,out,nln;
	var skips={undefined:true,LABEL:true,COMMENT:true,NOTOPCODE:true};
	var lines2=[],linehex=[],lineadr=-1;

	nln=10;
	
	for(i=0; i<outlist.length; i++){
		out=outlist[i];
		l=out[0];
		a=out[1];
		p=out[2];
		line=lines[l];

		if(p==EMPTYLINE){
			continue;
		}else if(p===undefined||p===null||p===false||p>=NOTOPCODE){
			continue
		}else{
			if(lineadr<0){
				lineadr=a;
			}
			p0=p&0x0ff;
			p1=(p>>8)&0x0ff
			p0=zero16(p0);
			p1=zero16(p1);
			linehex.push("#"+p0);
			linehex.push("#"+p1);
		}
		if(linehex.length>=8){
			lines2.push(""+nln.toString(10)+" poke #"+lineadr.toString(16)+
			","+linehex.join(","));
			linehex=[];
			nln+=10;
			lineadr=-1;
		}
	}
	if(linehex.length>0){
		lines2.push(""+nln.toString(10)+" poke #"+lineadr.toString(16)+
		","+linehex.join(","));
	}
	lines2.push("");

	bas=lines2.join("\n");
	return bas;
}
function m2b10(lines,outlist){
	var p,p0,p1;
	var bas="",i,line,out,nln;
	var skips={undefined:true,LABEL:true,COMMENT:true,NOTOPCODE:true};
	var lines2=[],linehex=[],lineadr=-1;

	nln = 10;
	
	for (i = 0; i < outlist.length; i++){
		out=outlist[i];
		l=out[0];
		a=out[1];
		p=out[2];
		line=lines[l];
		
		if (p==EMPTYLINE) {
			continue;
		} else if(p===undefined||p===null||p===false||p>=NOTOPCODE){
		 	continue
		} else {
			if (lineadr < 0) {
				lineadr = a;
			}
			p0 = p & 0x0ff;
			p1 = (p >> 8) & 0x0ff
			linehex.push(p0.toString(10));
			linehex.push(p1.toString(10));
			
			var ln = nln.toString(10) + " POKE#" + lineadr.toString(16).toUpperCase() + "," + linehex.join(",");
			if (ln.length > 200 - 8) {
//			if (linehex.length == 40) {
				lines2.push(ln);
				lineadr = -1;
				linehex=[];
				nln+=10;
			}
		}
	}
	if (linehex.length > 0) {
		lines2.push(nln.toString(10) + " POKE#" + lineadr.toString(16).toUpperCase() +","+linehex.join(","));
	}
	lines2.push("");

	bas=lines2.join("\n");
	return bas;
}
function m2b2(lines, outlist){
	var bas = "";
	var skips = { undefined: true, LABEL: true, COMMENT: true, NOTOPCODE:true };
	for (var i = 0; i < outlist.length; i++) {
		var out = outlist[i];
		var l = out[0];
		var a = out[1];
		var p = out[2];
		var line = lines[l];

		if (p==EMPTYLINE) {
			continue;
		} else if (p === undefined || p === null || p === false || p >= NOTOPCODE) {
			var nln = i * 10 + 10;
			bas += nln + "'" + line + "\n";
		} else {
			var p0 = p & 0x0ff;
			var p1 = (p >> 8) & 0x0ff;
			p0 = zero2(p0);
			p1 = zero2(p1);
			var nln = i * 10 + 10;
			bas += nln + " POKE#" + a.toString(16).toUpperCase() + ",`" + p0 + ",`" + p1+" :'" + line + "\n";
		}
	}
	return bas;
}
function m2bin(lines,outlist){
	var p,p0,p1;
	var bas="",i,line,out,nln;
	var skips={undefined:true,LABEL:true,COMMENT:true,NOTOPCODE:true};
	for(i=0; i<outlist.length; i++){
		out=outlist[i];
		l=out[0];
		a=out[1];
		p=out[2];
		line=lines[l];

		if(p==EMPTYLINE){
			continue;
		}else if(p===undefined||p===null||p===false||p>=NOTOPCODE){
		}else{
			p0=p&0x0ff;
			p1=(p>>8)&0x0ff
			p0=zero2(p0);
			p1=zero2(p1);
			bas+=""+p1+p0+"\n";
		}
	}
	return bas;
}
function m2ar2(lines,outlist){
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
			bas += "[" + n + "]=`" + zero2(p >> 8) + " " + zero2(p & 0xff) + " :'" + line + "\n";
			n++;
		}
	}
	return bas;
}
function m2ar16(lines,outlist) {
	var p,p0,p1;
	var bas="",i,line,out;
	var skips={undefined:true,LABEL:true,COMMENT:true,NOTOPCODE:true};
	var n = 0;
	var linehex=[];
	
	var limit = 30;
	var nln = 10;
	for (var i = 0; i < outlist.length; i++) {
		out=outlist[i];
		l=out[0];
		a=out[1];
		p=out[2];
		line=lines[l];

		if(p==EMPTYLINE) {
			continue;
		} else if(p===undefined||p===null||p===false||p>=NOTOPCODE){
		} else {
			var hex = "000" + p.toString(16).toUpperCase();
			linehex.push("#" + hex.substring(hex.length - 4));
			
			if (linehex.length == limit) {
				bas += nln + " LET[" + n + "]," + linehex.join(",") + "\n";
				n += linehex.length;
				nln += 10;
				linehex = [];
			}
		}
	}
	if (linehex.length > 0) {
		bas += nln + " LET[" + n + "]," + linehex.join(",") + "\n";
	}
	return bas;
}
// from http://tagiyasoft.blog.jp/asm15.js
function m2js(lines,outlist){
	var p,p0,p1;
	var bas="",i,line,out;
	var skips={undefined:true,LABEL:true,COMMENT:true,NOTOPCODE:true};
	var lines2=[],linehex=[],lineadr=-1;
	
	for(i=0; i<outlist.length; i++){
		out=outlist[i];
		l=out[0];
		a=out[1];
		p=out[2];
		line=lines[l];

		if(p==EMPTYLINE){
			continue;
		}else if(p===undefined||p===null||p===false||p>=NOTOPCODE){
			continue
		}else{
			if(lineadr<0){
				lineadr=a;
			}
			p0=p&0x0ff;
			p1=(p>>8)&0x0ff
			linehex.push(p0);
			linehex.push(p1);
		}
		if(linehex.length>=16){
			lines2.push("\tmem(a,"
				+ linehex.join(",")
				+ ");a=a+"
				+ linehex.length
			);
			linehex=[];
			lineadr=-1;
		}
	}
	if (linehex.length>0) {
		lines2.push("\tmem(a,"
			+ linehex.join(",")
//			+ ");a=a+"+ linehex.length
			+ ")"
		);

	}
	lines2.push("");

	bas = "function asm() {\n" 
		+ '\tvar a=mem(" ");\n'
		+ lines2.join( ";\n" )
		+ "\treturn mem();\n"
		+ "}\n";
	return bas;
}
// for C lang
function m2c(lines,outlist){
	var p,p0,p1;
	var bas="",i,line,out;
	var skips={undefined:true,LABEL:true,COMMENT:true,NOTOPCODE:true};
	var lines2=[],linehex=[],lineadr=-1;

	for (i=0; i<outlist.length; i++){
		out=outlist[i];
		l=out[0];
		a=out[1];
		p=out[2];
		line=lines[l];

		if(p==EMPTYLINE){
			continue;
		}else if(p===undefined||p===null||p===false||p>=NOTOPCODE){
			continue
		}else{
			if(lineadr<0){
				lineadr=a;
			}
			p0=p&0x0ff;
			p1=(p>>8)&0x0ff
			linehex.push("0x" + zero16(p0));
			linehex.push("0x" + zero16(p1));
		}
		if(linehex.length>=16){
			lines2.push("\t" + linehex.join(", ") + ",");
			linehex=[];
			lineadr=-1;
		}
	}
	if (linehex.length>0){
		lines2.push("\t" + linehex.join(", "));
	}
	lines2.push("");

	bas = "const char ASM[] = {\n" 
		+ lines2.join("\n")
		+ "};\n";
	return bas;
}

// for hex file
function m2hex(lines,outlist){
	var p,p0,p1;
	var bas="",i,line,out;
	var skips={undefined:true,LABEL:true,COMMENT:true,NOTOPCODE:true};
	var lines2=[],linehex=[],lineadr=-1;
	
	var chk = 0;
	for (i=0; i<outlist.length; i++){
		out=outlist[i];
		l=out[0];
		a=out[1];
		p=out[2];
		line=lines[l];

		if(p==EMPTYLINE){
			continue;
		}else if(p===undefined||p===null||p===false||p>=NOTOPCODE){
			continue
		}else{
			if(lineadr<0){
				lineadr=a;
			}
			p0=p&0x0ff;
			p1=(p>>8)&0x0ff
			linehex.push(zero16(p0));
			linehex.push(zero16(p1));
			chk -= p0 + p1;
		}
		if (linehex.length>=16){
			var ad1 = lineadr >> 8;
			var ad2 = lineadr & 0xff;
			chk -= linehex.length + ad1 + ad2;
			lines2.push(":" + zero16(0x10) + zero16(ad1) + zero16(ad2) + "00" + linehex.join("") + zero16(chk & 0xff));
			chk = 0;
			linehex=[];
			lineadr=-1;
		}
	}
	if (linehex.length > 0) {
		var ad1 = lineadr >> 8;
		var ad2 = lineadr & 0xff;
		chk -= linehex.length + ad1 + ad2;
		lines2.push(":" + zero16(linehex.length) + zero16(ad1) + zero16(ad2) + "00" + linehex.join("") + zero16(chk & 0xff));
	}
	lines2.push("");

	bas = lines2.join("\n") + ":00000001FF\n";
	return bas;
}

// for mot file
function m2mot(lines, outlist) {
	var p,p0,p1;
	var bas="",i,line,out;
	var skips={undefined:true,LABEL:true,COMMENT:true,NOTOPCODE:true};
	var lines2=[],linehex=[],lineadr=-1;
	var startadr = -1;
	
	var chk = 0;
	for (i = 0; i < outlist.length; i++) {
		out=outlist[i];
		l=out[0];
		a=out[1];
		p=out[2];
		line=lines[l];

		if (p==EMPTYLINE) {
			continue;
		} else if (p===undefined||p===null||p===false||p>=NOTOPCODE) {
			continue
		} else {
			if (lineadr < 0) {
				if (startadr < 0)
					startadr = a;
				lineadr = a;
			}
			p0=p&0x0ff;
			p1=(p>>8)&0x0ff
			linehex.push(zero16(p0));
			linehex.push(zero16(p1));
			chk += p0 + p1;
		}
		if (linehex.length >= 16) {
			var ad1 = (lineadr >> 24) & 0xff;
			var ad2 = (lineadr >> 16) & 0xff;
			var ad3 = (lineadr >> 8) & 0xff;
			var ad4 = lineadr & 0xff;
			chk += linehex.length + ad1 + ad2 + ad3 + ad4;
			var len = linehex.length + 5;
			lines2.push("S3" + zero16(len) + zero16(ad1) + zero16(ad2) + zero16(ad3) + zero16(ad4) + linehex.join("") + zero16(~chk));
			chk = 0;
			linehex=[];
			lineadr=-1;
		}
	}
	if (linehex.length > 0) {
		var ad1 = (lineadr >> 24) & 0xff;
		var ad2 = (lineadr >> 16) & 0xff;
		var ad3 = (lineadr >> 8) & 0xff;
		var ad4 = lineadr & 0xff;
		chk += linehex.length + ad1 + ad2 + ad3 + ad4;
		var len = linehex.length + 5;
		lines2.push("S3" + zero16(len) + zero16(ad1) + zero16(ad2) + zero16(ad3) + zero16(ad4) + linehex.join("") + zero16(~chk));
	}
	var ad1 = (startadr >> 24) & 0xff;
	var ad2 = (startadr >> 16) & 0xff;
	var ad3 = (startadr >> 8) & 0xff;
	var ad4 = startadr & 0xff;
	var chk = 4 + ad1 + ad2 + ad3 + ad4; // dummy
	lines2.push("S704" + zero16(ad1) + zero16(ad2) + zero16(ad3) + zero16(ad4) + zero16(~chk));
	lines2.push("");

	bas = lines2.join("\n");
	return bas;
}

var fmt_dict = {
	"bas2": m2b2, "bas16": m2b16, "bas10": m2b10, "basar2": m2ar2, "basar16": m2ar16, "bin": m2bin, "latte": m2js, "c": m2c, "hex": m2hex, "mot": m2mot
};
