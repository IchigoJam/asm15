'	?USR(#700,ASC("A"))
'	22clock
'	+ 11clock * 32 = 352clock
'	-2 + 9
'	=29+352=381clock

	PUSH {LR,R4,R5,R6,R7}
	R2=9
	R2=R2<<8
	R1=R1+R2
	
	R2=R0
	R2=R2<<8
	R2=R2+R0
	R2=R2<<8
	R2=R2+R0
	R2=R2<<8
	R2=R2+R0
	
	R3=R2
	R4=R2
	R5=R2
	R6=R2
	R7=R2
	
	R0=32
@LOOP
	STM R1,{R2,R3,R4,R5,R6,R7}
	R0-=1
	IF !0 GOTO @LOOP
	
	POP {PC,R4,R5,R6,R7}
