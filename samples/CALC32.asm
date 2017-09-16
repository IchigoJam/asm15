'CALC32

	PUSH {LR,R4,R5,R6}
	R6=8
	R6=R6<<8
	R6=R1+R6
	
	R5=#F<<2
	
	R4=R0
	
	R0=R4>>2
	R0&=R5
	R0=[R6+R0]L
	R1=R4<<2
	R1&=R5
	R1=[R6+R1]L
	
	R2=R4>>12
	
	R2-0 ' plus
	IF !0 GOTO @SKIP1
		R0=R0+R1
		GOTO @END
	@SKIP1
	
	R2-1 ' minus
	IF !0 GOTO @SKIP2
		R0=R0-R1
		GOTO @END
	@SKIP2

	R2-2 ' multi
	IF !0 GOTO @SKIP3
		R0*=R1
		GOTO @END
	@SKIP3

	R2-3 ' division
	IF !0 GOTO @SKIP4
		PUSH {R4}
		CALL R3
		POP {R4}
		GOTO @END
	@SKIP4

	R2-4 ' division(remain)
	IF !0 GOTO @SKIP5
		PUSH {R4}
		CALL R3
		POP {R4}
		R0=R1
'		GOTO @END
	@SKIP5

@END
	R4=R4>>6
	R4&=R5
	[R6+R4]L=R0
	POP {LR,R4,R5,R6}
