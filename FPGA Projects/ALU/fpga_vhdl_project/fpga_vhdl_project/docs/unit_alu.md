# Unit Note — alu (DUT)

## Scope
Registered ALU. One clocked process evaluates `calc_result` and `calc_flags`,
then drives the output ports.

## Reset Behavior
- On `rst = '1'`: result := 0, flags.zero := '1', flags.carry := '0'.
- On release of reset: normal operation resumes on the next rising clock edge.

## Implementation Notes
- The combinational helpers are called inside a clocked process; results are
  held in local variables and latched to ports only at the active clock edge.
- No inferred latches, no combinational feedback loops, no multiple drivers.

## GHDL Order
Analyzed after `alu_pkg.vhd`.