; A yellow border. Four loops: two rows, then two columns stepping by 8.
        LOAD  R2, YELLOW

        LOAD  R0, 0          ; top row
        LOAD  R1, 8
top:    STORE R2, [R0]
        ADDI  R0, 1
        SUBI  R1, 1
        JNZ   R1, top

        LOAD  R0, 56         ; bottom row
        LOAD  R1, 8
bottom: STORE R2, [R0]
        ADDI  R0, 1
        SUBI  R1, 1
        JNZ   R1, bottom

        LOAD  R0, 8          ; left column, rows 1-6
        LOAD  R1, 6
left:   STORE R2, [R0]
        ADDI  R0, 8
        SUBI  R1, 1
        JNZ   R1, left

        LOAD  R0, 15         ; right column, rows 1-6
        LOAD  R1, 6
right:  STORE R2, [R0]
        ADDI  R0, 8
        SUBI  R1, 1
        JNZ   R1, right

        HALT
