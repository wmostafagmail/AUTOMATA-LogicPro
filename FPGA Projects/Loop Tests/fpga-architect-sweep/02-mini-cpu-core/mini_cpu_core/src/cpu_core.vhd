library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use work.cpu_pkg.all;

entity cpu_core is
  port (
    clk        : in  std_logic;
    rst        : in  std_logic;
    pc_out     : out addr_t;
    mem_addr   : out addr_t;
    mem_rd_en  : out std_logic;
    mem_wr_en  : out std_logic;
    mem_wr_data: out data_t;
    mem_rd_data: in  data_t;
    halt_out   : out std_logic;
    reg_out    : out data_t(3 downto 0)
  );
end entity cpu_core;

architecture rtl of cpu_core is
  signal pc_reg    : addr_t := (others => '0');
  signal reg_file  : data_t(3 downto 0) := (others => (others => '0'));
  signal instr     : data_t;
  signal alu_res   : data_t;
  signal next_wr_en: std_logic;
  signal next_reg_val: data_t;
begin
  pc_out <= pc_reg;
  mem_addr <= pc_reg;
  mem_rd_en <= '1';
  next_wr_en <= '0';
  next_reg_val <= (others => '0');
  
  mem_wr_en <= next_wr_en;
  mem_wr_data <= next_reg_val;
  halt_out <= '0';
  reg_out <= reg_file;

  process(clk, rst)
    variable op : unsigned(3 downto 0);
    variable a_idx : reg_idx_t;
    variable b_idx : reg_idx_t;
    variable res : data_t;
  begin
    if rst = '1' then
      pc_reg <= (others => '0');
      next_wr_en <= '0';
    elsif clk'event and clk = '1' then
      instr <= mem_rd_data;
      op := instr(7 downto 4);
      a_idx := instr(3 downto 2);
      b_idx := instr(1 downto 0);
      
      next_wr_en <= '0';
      next_reg_val <= reg_file(to_integer(b_idx));
      
      case op is
        when OP_ADD =>
          res := reg_file(to_integer(a_idx)) + reg_file(to_integer(b_idx));
          next_reg_val <= res;
          next_wr_en <= '1';
        when OP_SUB =>
          res := reg_file(to_integer(a_idx)) - reg_file(to_integer(b_idx));
          next_reg_val <= res;
          next_wr_en <= '1';
        when OP_AND =>
          res := reg_file(to_integer(a_idx)) and reg_file(to_integer(b_idx));
          next_reg_val <= res;
          next_wr_en <= '1';
        when OP_OR =>
          res := reg_file(to_integer(a_idx)) or reg_file(to_integer(b_idx));
          next_reg_val <= res;
          next_wr_en <= '1';
        when OP_LOAD =>
          next_reg_val <= mem_rd_data;
          next_wr_en <= '1';
        when others =>
          null;
      end case;
      
      pc_reg <= pc_reg + 1;
    end if;
  end process;
end architecture rtl;