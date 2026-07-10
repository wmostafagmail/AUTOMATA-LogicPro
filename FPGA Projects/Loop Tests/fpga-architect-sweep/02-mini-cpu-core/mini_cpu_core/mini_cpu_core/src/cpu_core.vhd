library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use work.cpu_pkg.all;

entity cpu_core is
  generic (
    MEM_DEPTH : integer := 256
  );
  port (
    clk       : in  std_logic;
    rst       : in  std_logic;
    pc_addr   : out addr_t;
    pc_data   : in  data_t;
    mem_addr  : out addr_t;
    mem_wr_d  : out data_t;
    mem_rd_d  : in  data_t;
    mem_wr_en : out std_logic;
    mem_rd_en : out std_logic;
    dbg_reg   : out data_t
  );
end entity cpu_core;

architecture rtl of cpu_core is
  signal pc_reg   : addr_t := (others => '0');
  signal ir_reg   : data_t := (others => '0');
  signal regs     : reg_array_t := (others => (others => '0'));
  signal state_reg : integer range 0 to 3 := 0;
  signal alu_res  : data_t := (others => '0');
begin

  pc_addr <= pc_reg;
  dbg_reg <= regs(0);

  -- ALU Combinational
  alu_proc : process(ir_reg, regs)
    variable op : op_code_t;
    variable a_idx : integer range 0 to 7;
    variable b_idx : integer range 0 to 7;
    variable a_val : data_t;
    variable b_val : data_t;
    variable tmp_res : data_t;
  begin
    op := to_integer(unsigned(ir_reg(7 downto 5)));
    a_idx := to_integer(unsigned(ir_reg(4 downto 2)));
    b_idx := to_integer(unsigned(ir_reg(1 downto 0)));
    
    if a_idx >= 0 and a_idx <= 7 then
      a_val := regs(a_idx);
    else
      a_val := (others => '0');
    end if;
    
    if b_idx >= 0 and b_idx <= 7 then
      b_val := regs(b_idx);
    else
      b_val := (others => '0');
    end if;

    tmp_res := alu_op(a_val, b_val, op);
    alu_res <= tmp_res;
  end process alu_proc;

  -- Control/Sequential
  ctrl_proc : process(clk, rst)
    variable write_en : std_logic;
    variable write_idx : integer range 0 to 7;
    variable write_data : data_t;
    variable next_pc_v : addr_t;
    variable next_state_v : integer range 0 to 3;
    variable next_regs_v : reg_array_t;
  begin
    next_regs_v := regs;
    next_state_v := state_reg;
    next_pc_v := pc_reg;
    write_en := '0';
    write_idx := 0;
    write_data := (others => '0');
    mem_wr_en <= '0';
    mem_rd_en <= '0';

    if rst = '1' then
      pc_reg <= (others => '0');
      ir_reg <= (others => '0');
      state_reg <= 0;
      regs <= (others => (others => '0'));
    elsif rising_edge(clk) then
      case state_reg is
        when 0 =>
          ir_reg <= pc_data;
          next_state_v := 1;
          mem_rd_en <= '1';
        when 1 =>
          next_state_v := 2;
        when 2 =>
          mem_rd_en <= '0';
          mem_wr_en <= '0';
          case to_integer(unsigned(ir_reg(7 downto 5))) is
            when OP_ADD | OP_SUB | OP_AND | OP_OR =>
              write_en := '1';
              write_idx := to_integer(unsigned(ir_reg(4 downto 2)));
              write_data := alu_res;
            when OP_LDA =>
              write_en := '1';
              write_idx := to_integer(unsigned(ir_reg(4 downto 2)));
              write_data := mem_rd_d;
            when OP_STR =>
              write_en := '1';
              write_idx := to_integer(unsigned(ir_reg(1 downto 0)));
              mem_wr_d <= regs(write_idx);
              mem_wr_en <= '1';
            when OP_JMP =>
              next_pc_v := ir_reg;
            when OP_HLT =>
              null;
            when others =>
              null;
          end case;
          
          if write_en = '1' then
            next_regs_v(write_idx) := write_data;
          end if;
          
          next_state_v := 3;
        when 3 =>
          next_state_v := 0;
        when others =>
          next_state_v := 0;
      end case;
      
      pc_reg <= next_pc_v;
      state_reg <= next_state_v;
      regs <= next_regs_v;
    end if;
  end process ctrl_proc;

end architecture rtl;