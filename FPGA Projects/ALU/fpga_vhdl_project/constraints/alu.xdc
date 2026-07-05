## ------------------------------------------------------------------
## ALU Project - Constraints Placeholder
## Target: Generic portable (Xilinx Artix-7 family assumed)
## IMPORTANT: Update the following constraints for your actual FPGA board.
## ------------------------------------------------------------------

## Clock constraint (100 MHz => 10 ns period)
set_property PACKAGE_PIN [get_ports clk] <BOARD_CLK_PIN>;
set_property IOSTANDARD [get_ports clk] <BOARD_CLK_IOSTANDARD>;
create_clock -period 10.000 -name sys_clk -waveform {0.000 5.000} [get_ports clk];

## Reset constraint (synchronous active-high)
set_property PACKAGE_PIN [get_ports rst] <BOARD_RST_PIN>;
set_property IOSTANDARD [get_ports rst] <BOARD_RST_IOSTANDARD>;

## ALU operand A inputs
set_property PACKAGE_PIN [get_ports {a[0]}] <BOARD_A0_PIN>;
set_property PACKAGE_PIN [get_ports {a[1]}] <BOARD_A1_PIN>;
set_property PACKAGE_PIN [get_ports {a[2]}] <BOARD_A2_PIN>;
set_property PACKAGE_PIN [get_ports {a[3]}] <BOARD_A3_PIN>;
set_property PACKAGE_PIN [get_ports {a[4]}] <BOARD_A4_PIN>;
set_property PACKAGE_PIN [get_ports {a[5]}] <BOARD_A5_PIN>;
set_property PACKAGE_PIN [get_ports {a[6]}] <BOARD_A6_PIN>;
set_property PACKAGE_PIN [get_ports {a[7]}] <BOARD_A7_PIN>;
set_property IOSTANDARD [get_ports {a[*]}] LVCMOS33;

## ALU operand B inputs
set_property PACKAGE_PIN [get_ports {b[0]}] <BOARD_B0_PIN>;
set_property PACKAGE_PIN [get_ports {b[1]}] <BOARD_B1_PIN>;
set_property PACKAGE_PIN [get_ports {b[2]}] <BOARD_B2_PIN>;
set_property PACKAGE_PIN [get_ports {b[3]}] <BOARD_B3_PIN>;
set_property PACKAGE_PIN [get_ports {b[4]}] <BOARD_B4_PIN>;
set_property PACKAGE_PIN [get_ports {b[5]}] <BOARD_B5_PIN>;
set_property PACKAGE_PIN [get_ports {b[6]}] <BOARD_B6_PIN>;
set_property PACKAGE_PIN [get_ports {b[7]}] <BOARD_B7_PIN>;
set_property IOSTANDARD [get_ports {b[*]}] LVCMOS33;

## ALU opcode inputs (4 bits: 9 ops fit in 4-bit encoding)
set_property PACKAGE_PIN [get_ports {opcode[0]}] <BOARD_OP0_PIN>;
set_property PACKAGE_PIN [get_ports {opcode[1]}] <BOARD_OP1_PIN>;
set_property PACKAGE_PIN [get_ports {opcode[2]}] <BOARD_OP2_PIN>;
set_property PACKAGE_PIN [get_ports {opcode[3]}] <BOARD_OP3_PIN>;
set_property IOSTANDARD [get_ports {opcode[*]}] LVCMOS33;

## ALU result outputs (8 bits)
set_property PACKAGE_PIN [get_ports {result[0]}] <BOARD_R0_PIN>;
set_property PACKAGE_PIN [get_ports {result[1]}] <BOARD_R1_PIN>;
set_property PACKAGE_PIN [get_ports {result[2]}] <BOARD_R2_PIN>;
set_property PACKAGE_PIN [get_ports {result[3]}] <BOARD_R3_PIN>;
set_property PACKAGE_PIN [get_ports {result[4]}] <BOARD_R4_PIN>;
set_property PACKAGE_PIN [get_ports {result[5]}] <BOARD_R5_PIN>;
set_property PACKAGE_PIN [get_ports {result[6]}] <BOARD_R6_PIN>;
set_property PACKAGE_PIN [get_ports {result[7]}] <BOARD_R7_PIN>;
set_property IOSTANDARD [get_ports {result[*]}] LVCMOS33;

## ALU flag outputs
set_property PACKAGE_PIN [get_ports {flags[0]}] <BOARD_Z_FLAG_PIN>;  -- zero flag
set_property PACKAGE_PIN [get_ports {flags[1]}] <BOARD_C_FLAG_PIN>;  -- carry flag
set_property IOSTANDARD [get_ports flags] LVCMOS33;