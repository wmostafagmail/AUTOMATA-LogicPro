library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use work.mini_cpu_pkg.all;

entity mini_cpu_top is
  port (
    clk                : in  std_logic;
    reset_n            : in  std_logic;

    -- Program memory interface (separate from data to avoid tristate simulation issues)
    prog_read_addr     : out std_logic_vector(PC_WIDTH - 1 downto 0);
    prog_read_en       : out std_logic;
    prog_data_in       : in  std_logic_vector(DATA_WIDTH - 1 downto 0);

    -- Data memory interface (separate from program to avoid tristate simulation issues)
    data_addr          : out std_logic_vector(ADDR_WIDTH - 1 downto 0);
    data_write_en      : out std_logic;
    data_read_en       : out std_logic;
    data_write_data    : out std_logic_vector(DATA_WIDTH - 1 downto 0);
    data_data_out      : in  std_logic_vector(DATA_WIDTH - 1 downto 0);

    -- Debug/status outputs driven from internal mirrors only
    pc_out             : out std_logic_vector(PC_WIDTH - 1 downto 0);
    current_opcode_out : out opcode_t;
    zero_flag_out      : out std_logic
  );
end entity mini_cpu_top;

architecture rtl of mini_cpu_top is

  signal pc_reg       : std_logic_vector(PC_WIDTH - 1 downto 0) := (others => '0');
  signal instruction_reg : instruction_t;
  signal alu_result   : unsigned(7 downto 0);
  signal zero_flag    : std_logic;

  signal alu_op_sel   : integer range 0 to 7;
  signal write_reg_en : std_logic;
  signal write_mem_en : std_logic;
  signal read_mem_en  : std_logic;
  signal next_pc_valid: std_logic;
  signal pc_mux_select: std_logic;

  signal current_state : cpu_state_t := STATE_FETCH;
  signal next_state    : cpu_state_t;

  -- Internal mirrors for the shared data bus so we never read back an out port.
  signal rf_read1     : std_logic_vector(7 downto 0);
  signal mem_bus_int  : unsigned(7 downto 0);

begin

  -- Program Counter (synchronous, active-high reset)
  process(clk, reset_n)
  begin
    if reset_n = '0' then
      pc_reg <= (others => '0');
    elsif rising_edge(clk) then
      if next_pc_valid = '1' then
        if pc_mux_select = '1' then
          -- Branch/jump target encoded in the immediate field of the instruction.
          pc_reg <= std_logic_vector(instruction_reg.immediate & "00");
        else
          pc_reg <= std_logic_vector(unsigned(pc_reg) + 2);
        end if;
      end if;
    end if;
  end process;

  -- Instruction Register (latched on read enable from the program memory bus)
  process(clk)
  begin
    if rising_edge(clk) then
      if read_mem_en = '1' then
        instruction_reg <= decode_instruction(prog_data_in);
      end if;
    end if;
  end process;

  -- ALU instance (combinational)
  alu_inst : entity work.alu
    port map (
      a         => rf_read1,
      b         => std_logic_vector(mem_bus_int),
      alu_op    => alu_op_sel,
      result    => open,
      zero_flag => zero_flag
    );

  -- Register File instance
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
      write_data => std_logic_vector(alu_result),
      read_addr1 => instruction_reg.rs1,
      read_addr2 => instruction_reg.rs2,
      read_data1 => rf_read1,
      read_data2 => open
    );

  -- Control FSM instance
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

  -- Synchronous state register update (one clock of latency)
  process(clk, reset_n)
  begin
    if reset_n = '0' then
      current_state <= STATE_FETCH;
    elsif rising_edge(clk) then
      current_state <= next_state;
    end if;
  end process;

  -- Program memory address mux: PC during fetch/decode, ALU result during store.
  prog_read_addr <= pc_reg when read_mem_en = '1' else std_logic_vector(alu_result);
  prog_read_en   <= read_mem_en;

  -- Data memory address mux: PC or ALU result depending on operation.
  data_addr      <= pc_reg when write_mem_en = '0' and read_mem_en = '0' else std_logic_vector(alu_result);
  data_write_en  <= write_mem_en;
  data_read_en   <= read_mem_en;

  -- Internal bus mirror: capture what the ALU produces for mem operations.
  process(write_mem_en, alu_result)
  begin
    if write_mem_en = '1' then
      mem_bus_int <= alu_result;
    else
      mem_bus_int <= unsigned(data_data_out);
    end if;
  end process;

  -- Debug outputs driven from internal mirrors only.
  pc_out             <= pc_reg;
  current_opcode_out <= instruction_reg.opcode;
  zero_flag_out      <= zero_flag;

end architecture rtl;