; The worked example from docs/machine.md — a blue row across the top.
        LOAD  R0, 0          ; R0 = cursor address
        LOAD  R1, 8          ; R1 = counter
        LOAD  R2, BLUE       ; R2 = colour
loop:   STORE R2, [R0]
        ADDI  R0, 1
        SUBI  R1, 1
        JNZ   R1, loop
        HALT
