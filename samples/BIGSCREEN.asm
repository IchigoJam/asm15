	'BIG SCREEN PROGRAM
	'R0:param, address of 12 characters
	'R1:virtual memory offset(RAM)
	'R2:virtual memory offset(ROM)

	PUSH {LR,R4,R5,R6,R7}

	R12=R2 'save to R12
	R6=0 'offset 0-11
	R7=R1+R0 'real memory address of 12 characters

	R3=9
	R3=R3<<8
	R1=R1+R3

@LOOP0
	R0=[R7+R6]
	R0=R0<<3
	R2=R2+R0
	R4=0
@LOOP1
	R3=[R2+R4]
	R5=#80
@LOOP2
	R0=R3
	R0&=R5
	IF 0 GOTO @ELSE1
	R0=1
@ELSE1
	[R1]=R0
	R1+=1
	R5=R5>>1
	IF !0 GOTO @LOOP2

	R1+=24
	R4+=1
	R4-8
	IF !0 GOTO @LOOP1

	R1-=24
	R0=3
	R0&=R6
	R0-3
	IF 0 GOTO @ELSE2
	R1-=224
@ELSE2
	R2=R12
	R6+=1
	R6-12
	IF !0 GOTO @LOOP0
@END
	POP {PC,R4,R5,R6,R7}

'A=USR(#700,"+IchigoJam+!"):WAIT120
