### avr_core_skeleton.vhd
library IEEE;
use IEEE.std_logic_1164.all;
use IEEE.numeric_std.all;

entity avr_core_skeleton is
  generic (
    ADDR_WIDTH : natural := 8;
    DATA_WIDTH : natural := 8
  );
  port (
    clk        : in  std_logic;
    reset_n    : in  std_logic;
    addr       : out std_logic_vector(ADDR_WIDTH-1 downto 0);
    data_in    : in  std_logic_vector(DATA_WIDTH-1 downto 0);
    data_out   : out std_logic_vector(DATA_WIDTH-1 downto 0);
    rw_n       : out std_logic;
    uart_tx    : out std_logic;
    debug_zero : out std_logic
  );
end entity avr_core_skeleton;

architecture rtl of avr_core_skeleton is
  -- Internal pipeline registers
  signal pc_reg      : unsigned(ADDR_WIDTH-1 downto 0) := (others => '0');
  signal addr_reg    : std_logic_vector(ADDR_WIDTH-1 downto 0);
  signal sreg_z_reg  : std_logic := '0';
  signal uart_state  : natural range 0 to 3 := 0;
  signal alu_zero    : std_logic;

  -- Synthesis attributes for debugging & hazard mitigation
  attribute KEEP : string;
  attribute KEEP of pc_reg      : signal is "TRUE";
  attribute KEEP of sreg_z_reg  : signal is "TRUE";
  attribute KEEP of uart_state  : signal is "TRUE";
  attribute FSM_ENCODING : string;
  attribute FSM_ENCODING of uart_state : signal is "gray";

begin
  -- Address Generation & Hazard Mitigation
  -- The hazard scan flagged addr[7:0] setup/hold violations near clk edges.
  -- Registering the address output and decoupling combinational logic resolves the race.
  addr_gen_proc : process(clk, reset_n)
  begin
    if reset_n = '0' then
      pc_reg      <= (others => '0');
      addr_reg    <= (others => '0');
    elsif rising_edge(clk) then
      -- Simulate PC increment / fetch logic
      pc_reg <= pc_reg + 1;
      -- Register address to eliminate setup/hold risk
      addr_reg <= std_logic_vector(pc_reg);
    end if;
  end process addr_gen_proc;

  addr <= addr_reg;

  -- UART TX State Machine (Idle-High observed)
  uart_proc : process(clk, reset_n)
  begin
    if reset_n = '0' then
      uart_state <= 0;
      uart_tx    <= '1';
    elsif rising_edge(clk) then
      case uart_state is
        when 0 =>
          uart_tx <= '1'; -- Idle state maintained
        when 1 =>
          -- Start bit / TX phase placeholder
          uart_tx <= '0';
        when others =>
          uart_tx <= '1'; -- Stop bit / return to idle
      end case;
    end if;
  end process uart_proc;

  -- Debug Zero Flag (SREG Z flag simulation)
  -- Transition at t=35ns aligns with instruction completion & zero result
  debug_proc : process(clk, reset_n)
  begin
    if reset_n = '0' then
      sreg_z_reg <= '0';
    elsif rising_edge(clk) then
      -- Placeholder: assert Z flag when ALU result is zero
      sreg_z_reg <= alu_zero;
    end if;
  end process debug_proc;

  debug_zero <= sreg_z_reg;

  -- Data Path & Control Placeholders
  data_out <= data_in;
  rw_n     <= '1'; -- Read idle

end architecture rtl;
