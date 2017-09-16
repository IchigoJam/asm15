'http://fukuno.jig.jp/1186 より
R1=0
@LOOP
R1=R1+R0
R0-=1
IF !0 GOTO @LOOP
R0=R1
RET