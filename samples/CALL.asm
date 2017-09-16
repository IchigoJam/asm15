'リンクレジスタ（戻るアドレス）をスタックに退避
push {LR}
'call は2命令(32bit)必要
call @sub1
'callを使ったらretではなくこれで戻る
pop {PC}
@sub1
r0=r0+1
ret
