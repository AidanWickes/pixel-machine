; A red diagonal. Stepping by 9 moves one right and one down at once,
; because the screen is 8 cells wide.
        LOAD  R2, RED
        LOAD  R0, 0
        LOAD  R1, 8
line:   STORE R2, [R0]
        ADDI  R0, 9
        SUBI  R1, 1
        JNZ   R1, line
        HALT
