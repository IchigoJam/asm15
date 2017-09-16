'LET [0],AdrLow,AdrHigh:USR(#700,0):L=[2]:H=[3]
'peek
r0=8
r0=r0<<#8
r1=r1+r0
r0=[r1+#0] L
r0=[r0+#0] L
[r1+1]L=r0
ret

'[2]=L:[3]=H:LET [0],AdrLow,AdrHigh:USR(#70E,0)
'poke
r0=8
r0=r0<<#8
r1=r1+r0
r0=[r1+1] L
r1=[r1+0] L
[r1+0]L=r0
ret
