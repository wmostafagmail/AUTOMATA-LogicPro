library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

package cpu_pkg is
  constant ADDR_WIDTH : integer := 8;
  constant DATA_WIDTH : integer := 8;

  subtype addr_t is unsigned(ADDR_WIDTH-1 downto 0);
  subtype data_t is std_logic_vector(DATA_WIDTH-1 downto 0);

  type instr_t is record
    op_code : data_t;
    rd      : addr_t;
    rs1     : addr_t;
    rs2     : addr_t;
    imm     : data_t
  end record;

  constant OP_ADD  : data_t := x"01";
  constant OP_AND  : data_t := x"02";
  constant OP_HALT : data_t := x"03";

  type prog_mem_t is array (natural range <>) of instr_t;
  type data_mem_t is array (natural range <>) of data_t;
end package;

package body cpu_pkg is
end package body;
