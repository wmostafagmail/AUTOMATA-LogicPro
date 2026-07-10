library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use work.mini_cpu_pkg.all;

entity mini_cpu_top is
  port (
    clk        : in  std_logic;
    reset_n    : in  std_logic;
    
    -- External memory interface
    mem_addr   : out std_logic_vector(11 downto 0);
    mem_data   : inout std_logic_vector(7 downto 0);
    mem_read   : out std_logic;
    mem_write  : out std_logic,
    
    -- Status outputs for debugging
    pc_out     : out std_logic_vector(11 downto 0);
    current_opcode_out : out std_logic_vector(7 downto 0)
  );
end entity mini_cpu_top;

architecture rtl of mini_cpu_top is
  
  signal pc_reg       : std_logic_vector(PC_WIDTH - 1 downto 0) := (others => '0');
  signal instruction_reg : instruction_t;
  signal alu_result   : std_logic_vector(7 downto 0);
  signal zero_flag    : std_logic;
  
  signal alu_op_sel   : integer range 0 to 7;
  signal write_reg_en : std_logic;
  signal write_mem_en : std_logic;
  signal read_mem_en  : std_logic;
  signal next_pc_valid: std_logic;
  signal pc_mux_select: std_logic;
  
  signal current_state : cpu_state_t := STATE_FETCH;
  signal next_state    : cpu_state_t;
  
begin
  
  -- Program Counter
  process(clk, reset_n)
  begin
    if reset_n = '0' then
      pc_reg <= (others => '0');
    elsif rising_edge(clk) then
      if next_pc_valid = '1' then
        if pc_mux_select = '1' then
          pc_reg <= instruction_reg.rs2 & instruction_reg.rd;
        else
          pc_reg <= std_logic_vector(unsigned(pc_reg) + 1);
        end if;
      end if;
    end if;
  end process;
  
  -- Instruction Register (fetch stage)
  process(clk)
  begin
    if rising_edge(clk) then
      if read_mem_en = '1' then
        instruction_reg.opcode   <= mem_data(7 downto 0);
        instruction_reg.rs1      <= mem_data(5 downto 4);
        instruction_reg.rs2      <= mem_data(3 downto 2);
        instruction_reg.rd       <= mem_data(1 downto 0);
      end if;
    end if;
  end process;
  
  -- ALU
  alu_inst : entity work.alu
    port map (
      a         => mem_data,
      b         => mem_data,
      alu_op    => alu_op_sel,
      result    => alu_result,
      zero_flag => zero_flag
    );
  
  -- Register File
  reg_file_inst : entity work.register_file
    generic map (
      REGISTER_COUNT => REGISTER_COUNT,
      REGISTER_WIDTH => REGISTER_WIDTH
    )
    port map (
      clk        => clk,
      reset_n    => reset_n,
      write_en   => write_reg_en,
      write_addr => instruction_reg.rd,
      write_data => alu_result,
      read_addr1 => instruction_reg.rs1,
      read_addr2 => instruction_reg.rs2,
      read_data1 => mem_data,
      read_data2 => open
    );
  
  -- Control FSM
  control_inst : entity work.control_fsm
    port map (
      clk           => clk,
      reset_n       => reset_n,
      current_state => current_state,
      instruction   => instruction_reg,
      zero_flag     => zero_flag,
      alu_op_sel    => alu_op_sel,
      write_reg_en  => write_reg_en,
      write_mem_en  => write_mem_en,
      read_mem_en   => read_mem_en,
      next_pc_valid => next_pc_valid,
      pc_mux_select => pc_mux_select,
      next_state    => next_state
    );
  
  -- State register update (synchronous)
  process(clk, reset_n)
  begin
    if reset_n = '0' then
      current_state <= STATE_FETCH;
    elsif rising_edge(clk) then
      current_state <= next_state;
    end if;
  end process;
  
  -- Memory interface
  mem_addr   <= pc_reg when read_mem_en = '1' else alu_result;
  mem_read   <= read_mem_en;
  mem_write  <= write_mem_en;
  
  -- Debug outputs
  pc_out     <= pc_reg;
  current_opcode_out <= instruction_reg.opcode;

end architecture rtl;