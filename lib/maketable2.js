// public domain

var makeTable = function(id, f) {
//	var s = f2s(f);
	var s = f.toString().match(/\n([\s\S]*)\n/)[1];
	var ss = s.split("\n");
//	var html = "<table id='" + id + "'>";
	var html = "";
	for (var i = 0; i < ss.length; i++) {
		var td = i == 0 ? "th" : "td";
		var ss2 = ss[i].split("\t");
		html += "<tr>";
		for (var j = 0; j < ss2.length; j++) {
			var ncol = 0;
			for (var k = j + 1; k < ss2.length; k++) {
				if (ss2[k] != "")
					break;
				ncol++;
			}
			if (ncol > 0) {
				html += "<" + td + " colspan=" + (1 + ncol) + ">" + ss2[j] + "</" + td + ">";
				j += ncol;
			} else {
				html += "<" + td + ">" + ss2[j] + "</" + td + ">";
			}
		}
		html += "</tr>";
	}
//	html += "</table>;
	document.getElementById(id).innerHTML = html;
};
