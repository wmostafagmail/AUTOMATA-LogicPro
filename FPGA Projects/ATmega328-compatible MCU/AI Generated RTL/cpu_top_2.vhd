library IEEE;
use IEEE.std_logic_1164.all;
use IEEE.numeric_std.all;

entity cpu_top is
  generic (
    ADDR_WIDTH : natural := 8;
    DATA_WIDTH : natural := 8
  );
  port (
    clk        : in  std_logic;
    reset_n    : in  std_logic;
    uart_tx    : out std_logic;
    debug_zero : out std_logic;
    addr       : out std_logic_vector(ADDR_WIDTH-1 downto 0);
    data_in    : in  std_logic_vector(DATA_WIDTH-1 downto 0);
    data_out   : out std_logic_vector(DATA_WIDTH-1 downto 0);
    we         : out std_logic;
    re         : out std_logic;
    irq        : in  std_logic;
    ready      : out std_logic
  );
end entity cpu_top;

architecture rtl of cpu_top is
  type state_type is (IDLE, FETCH, DECODE, EXEC, MEM_RD, MEM_WR);
  signal state_reg, state_next : state_type := IDLE;

  -- Address pipeline register to eliminate setup/hold race conditions
  signal addr_reg : std_logic_vector(ADDR_WIDTH-1 downto 0) := (others => '0');
  signal addr_comb : std_logic_vector(ADDR_WIDTH-1 downto 0);

  -- UART TX state machine
  signal uart_tx_reg : std_logic := '1';  -- Idle high
  signal uart_cnt    : unsigned(3 downto 0) := (others => '0');

  -- Debug/Flag registers
  signal zero_flag : std_logic := '0';
  signal pc_reg    : unsigned(ADDR_WIDTH-1 downto 0) := (others => '0');

begin

  -- Synchronous process with asynchronous reset
  process(clk, reset_n)
  begin
    if reset_n = '0' then
      state_reg     <= IDLE;
      addr_reg      <= (others => '0');
      uart_tx_reg   <= '1';
      uart_cnt      <= (others => '0');
      zero_flag     <= '0';
      pc_reg        <= (others => '0');
    elsif rising_edge(clk) then
      -- State transition
      state_reg <= state_next;

      -- Register combinatorial address to fix setup/hold violations
      addr_reg <= addr_comb;

      -- UART TX shift logic (idle high, start bit low, stop bit high)
      if uart_cnt = 9 then
        uart_tx_reg <= '1';
        uart_cnt    <= (others => '0');
      elsif uart_cnt > 0 then
        uart_tx_reg <= '0';
      end if;
      if uart_cnt < 9 and state_next = MEM_WR then
        uart_cnt <= uart_cnt + 1;
      end if;

      -- Debug zero flag update (tied to ALU result or explicit trigger)
      if state_next = EXEC then
        zero_flag <= '1'; -- Simulate zero-flag assertion post-ALU
      else
        zero_flag <= '0';
      end if;

      -- Program counter increment
      if state_next = FETCH or state_next = EXEC then
        pc_reg <= pc_reg + 1;
      end if;
    end if;
  end process;

  -- Combinatorial next-state and address generation
  process(state_reg, data_in, pc_reg)
  begin
    state_next    <= state_reg;
    addr_comb     <= std_logic_vector(pc_reg);
    data_out      <= (others => '0');
    we            <= '0';
    re            <= '0';

    case state_reg is
      when IDLE =>
        state_next <= FETCH;
        addr_comb  <= (others => '0');
      when FETCH =>
        state_next <= DECODE;
        addr_comb  <= std_logic_vector(pc_reg);
      when DECODE =>
        state_next <= EXEC;
        addr_comb  <= std_logic_vector(pc_reg) + 1;
      when EXEC =>
        state_next <= MEM_RD;
        addr_comb  <= std_logic_vector(pc_reg) + 2;
      when MEM_RD =>
        state_next <= IDLE;
        re         <= '1';
        addr_comb  <= std_logic_vector(pc_reg) + 3;
      when others =>
        state_next <= IDLE;
    end case;
  end process;

  -- Output assignments
  addr       <= addr_reg;
  uart_tx    <= uart_tx_reg;
  debug_zero <= zero_flag;
  ready      <= '1' when state_reg = IDLE else '0';

end architecture rtl;
