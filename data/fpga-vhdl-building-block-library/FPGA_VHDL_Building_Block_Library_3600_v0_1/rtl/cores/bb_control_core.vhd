library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity bb_control_core is
  generic (
    CMD_WIDTH      : positive := 8;
    CFG_WIDTH      : positive := 32;
    STATUS_WIDTH   : positive := 32;
    LATENCY_CYCLES : positive := 4
  );
  port (
    clk     : in  std_logic;
    rst_n   : in  std_logic;
    start   : in  std_logic;
    abort   : in  std_logic;
    command : in  std_logic_vector(CMD_WIDTH-1 downto 0);
    cfg     : in  std_logic_vector(CFG_WIDTH-1 downto 0);
    busy    : out std_logic;
    done    : out std_logic;
    error   : out std_logic;
    status  : out std_logic_vector(STATUS_WIDTH-1 downto 0)
  );
end entity;

architecture rtl of bb_control_core is
  signal busy_reg, done_reg, error_reg : std_logic := '0';
  signal remaining : natural range 0 to LATENCY_CYCLES := 0;
  signal status_reg : std_logic_vector(STATUS_WIDTH-1 downto 0) := (others => '0');
begin
  busy <= busy_reg;
  done <= done_reg;
  error <= error_reg;
  status <= status_reg;
  process(clk)
  begin
    if rising_edge(clk) then
      done_reg <= '0';
      if rst_n = '0' then
        busy_reg <= '0';
        error_reg <= '0';
        remaining <= 0;
        status_reg <= (others => '0');
      elsif abort = '1' and busy_reg = '1' then
        busy_reg <= '0';
        error_reg <= '1';
        remaining <= 0;
      elsif start = '1' and busy_reg = '0' then
        busy_reg <= '1';
        error_reg <= '0';
        remaining <= LATENCY_CYCLES;
        status_reg <= std_logic_vector(resize(unsigned(command), STATUS_WIDTH)) xor
                      std_logic_vector(resize(unsigned(cfg), STATUS_WIDTH));
      elsif busy_reg = '1' then
        if remaining <= 1 then
          remaining <= 0;
          busy_reg <= '0';
          done_reg <= '1';
        else
          remaining <= remaining - 1;
        end if;
      end if;
    end if;
  end process;
end architecture;
