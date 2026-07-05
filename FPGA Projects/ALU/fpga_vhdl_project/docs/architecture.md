# ALU Architecture Notes

## Block Responsibilities
- **alu_pkg**: Pure helper functions `calc_result` and `calc_flags`. No side effects; safe for synthesis or simulation reuse. Normalizes raw `std_logic_vector` inputs to typed `unsigned` operands before arithmetic/logic/shift operations.
- **alu (entity)**: Registered ALU with synchronous reset. On each rising clock edge, computes result via package functions and updates output ports. Separates combinational computation (in package) from sequential registration (in architecture).

## Interface Table
| Port      | Direction | Type          | Width | Notes                              |
|-----------|-----------|---------------|-------|------------------------------------|
| clk       | in        | std_logic     | 1     | Rising-edge clock                  |
| rst       | in        | std_logic     | 1     | Synchronous active-high reset      |
| opcode    | in        | alu_op_t      | -     | Operation select (enum)            |
| a         | in        | std_logic_vector | WIDTH-1 downto 0 | Operand A                  |
| b         | in        | std_logic_vector | WIDTH-1 downto 0 | Operand B                  |
| result    | out       | std_logic_vector | WIDTH-1 downto 0 | Computed result            |
| flags     | out       | alu_flags_t   | -     | Record: zero, carry                |

## Clock and Reset Table
| Signal | Style              | Polarity | Effect on DUT                          |
|--------|--------------------|----------|----------------------------------------|
| clk    | Synchronous        | Rising   | Registers result and flags             |
| rst    | Synchronous        | Active-High | Forces result=0, zero_flag='1', carry='0' |

## Design Decisions
- Combinational logic isolated in `alu_pkg` functions for clarity and testability.
- Single synchronous process in the entity architecture avoids inferred latches.
- No CDC/RDC paths (fully synchronous design).
- Reset value is deterministic: zero result with zero flag asserted, carry deasserted.