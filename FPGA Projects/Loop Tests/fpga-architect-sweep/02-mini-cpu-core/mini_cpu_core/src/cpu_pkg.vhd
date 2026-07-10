library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

package cpu_pkg is
  constant OP_ADD : integer := 0;
  constant OP_SUB : integer := 1;
  constant OP_AND : integer := 2;
  constant OP_OR  : integer := 3;
  constant OP_LDA : integer := 4;
  constant OP_STR : integer := 5;
  constant OP_JMP : integer := 6;
  constant OP_HLT : integer := 7;

  subtype op_code_t is integer range 0 to 7;
  subtype reg_idx_t is integer range 0 to 7;
  subtype data_t is std_logic_vector(7 downto 0);
  subtype addr_t is std_logic_vector(7 downto 0);

  component cpu_core is
    generic (
      MEM_DEPTH : integer := 256
    );
    port (
      clk      : in  std_logic;
      rst      : in  std_logic;
      pc_addr  : out addr_t;
      pc_data  : in  data_t;
      mem_addr : out addr_t;
      mem_wr_d : out data_t;
      mem_rd_d : in  data_t;
      mem_wr_en: out std_logic;
      mem_rd_en: out std_logic;
      dbg_reg  : out data_t
    );
  end component;
end package cpu_pkg;