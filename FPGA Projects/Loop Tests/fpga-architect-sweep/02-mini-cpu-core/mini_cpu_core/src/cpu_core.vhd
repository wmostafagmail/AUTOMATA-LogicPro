library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use work.cpu_pkg.all;

entity cpu_core is
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
end entity cpu_core;

architecture rtl of cpu_core is
  signal pc_reg : addr_t := (others => '0');
  signal ir_reg : data_t := (others => '0');
  signal regs    : array(reg_idx_t range 0 to 7) of data_t := (others => (others => '0'));
  signal alu_res: data_t := (others => '0');
  signal state_reg : integer range 0 to 3 := 0;
  signal mem_wr_d_int : data_t;
begin
  pc_addr <= pc_reg;
  mem_addr <= pc_reg;

  fetch_proc : process(clk, rst)
  begin
    if rst = '1' then
      pc_reg <= (others => '0');
    elsif rising_edge(clk) then
      if state_reg = 0 then
        pc_reg <= pc_data;
      end if;
    end if;
  end process fetch_proc;

  decode_exec_proc : process(clk, rst)
    variable op : op_code_t;
    variable a_idx : integer range 0 to 7;
    variable b_idx : integer range 0 to 7;
    variable idx : integer range 0 to 7;
    variable a_val : data_t;
    variable b_val : data_t;
  begin
    if rst = '1' then
      ir_reg <= (others => '0');
      state_reg <= 0;
      mem_wr_en <= '0';
      mem_rd_en <= '0';
      mem_wr_d_int <= (others => '0');
      dbg_reg <= (others => '0');
    elsif rising_edge(clk) then
      case state_reg is
        when 0 =>
          ir_reg <= pc_data;
          state_reg <= 1;
          mem_rd_en <= '1';
          mem_wr_en <= '0';
        when 1 =>
          op := to_integer(unsigned(ir_reg(7 downto 5)));
          a_idx := to_integer(unsigned(ir_reg(4 downto 2)));
          b_idx := to_integer(unsigned(ir_reg(1 downto 0)));
          state_reg <= 2;
        when 2 =>
          mem_rd_en <= '0';
          mem_wr_en <= '0';
          case op is
            when OP_ADD =>
              a_val := regs(a_idx);
              b_val := regs(b_idx);
              regs(a_idx) <= alu_op(a_val, b_val, OP_ADD);
              mem_wr_en <= '0';
            when OP_SUB =>
              a_val := regs(a_idx);
              b_val := regs(b_idx);
              regs(a_idx) <= alu_op(a_val, b_val, OP_SUB);
              mem_wr_en <= '0';
            when OP_AND =>
              a_val := regs(a_idx);
              b_val := regs(b_idx);
              regs(a_idx) <= alu_op(a_val, b_val, OP_AND);
              mem_wr_en <= '0';
            when OP_OR =>
              a_val := regs(a_idx);
              b_val := regs(b_idx);
              regs(a_idx) <= alu_op(a_val, b_val, OP_OR);
              mem_wr_en <= '0';
            when OP_LDA =>
              regs(a_idx) <= mem_rd_d;
              mem_wr_en <= '0';
            when OP_STR =>
              regs(b_idx) <= mem_wr_d_int;
              mem_wr_en <= '1';
            when OP_JMP =>
              pc_reg <= ir_reg;
              mem_wr_en <= '0';
            when OP_HLT =>
              mem_wr_en <= '0';
            when others =>
              mem_wr_en <= '0';
          end case;
          state_reg <= 3;
        when 3 =>
          state_reg <= 0;
        when others =>
          state_reg <= 0;
      end case;
    end if;
  end process decode_exec_proc;
  mem_wr_d <= mem_wr_d_int;
end architecture rtl;
