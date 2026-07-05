# Verification Strategy

## Testbench Coverage
The self-checking testbench (alu_tb.vhd) covers:

1. **Reset State**: Verify zero output and zero flag after reset deassertion
2. **Arithmetic Operations**:
   - ADD: 1 + 2 = 3 (normal case)
   - ADD: 255 + 1 = 0 with carry (overflow case)
   - SUB: 5 - 3 = 2 (normal case)
   - SUB: 0 - 1 = 255 with no borrow (underflow case)
3. **Logical Operations**:
   - AND: F0h AND A0h = A0h
   - OR: F0h OR 0Fh = FFh
   - XOR: F0h XOR 0Fh = FFh
4. **Unary Operation**:
   - NOT: NOT F0h = 0Fh
5. **Shift Operations**:
   - SLL: 01h << 1 = 02h
   - SRL: 02h >> 1 = 01h
6. **NOP**: Verify zero output and zero flag

## Verification Checklist
- [ ] All operations produce correct results
- [ ] Carry flag asserted on ADD overflow
- [ ] Carry flag cleared on SUB underflow (inverted borrow)
- [ ] Zero flag asserted when result is zero
- [ ] Reset behavior matches specification
- [ ] No simulation errors or warnings

## GHDL Simulation Commands
```bash
ghdl -a --std=08 src/alu_pkg.vhd
ghdl -a --std=08 src/alu.vhd
ghdl -a --std=08 tb/alu_tb.vhd
ghdl -e --std=08 alu_tb
ghdl -r --std=08 alu_tb --stop-time=120us