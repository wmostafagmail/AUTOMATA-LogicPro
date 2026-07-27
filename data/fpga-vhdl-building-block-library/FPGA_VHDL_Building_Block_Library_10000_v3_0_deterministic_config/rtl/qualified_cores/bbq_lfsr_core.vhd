library ieee;
use ieee.std_logic_1164.all;

entity bbq_lfsr_core is
  generic (
    WIDTH     : positive := 32;
    POLY_MASK : std_logic_vector(WIDTH-1 downto 0) := x"80200003";
    SEED      : std_logic_vector(WIDTH-1 downto 0) := x"00000001"
  );
  port (
    clk      : in  std_logic;
    rst_n    : in  std_logic;
    enable   : in  std_logic;
    load     : in  std_logic;
    seed_in  : in  std_logic_vector(WIDTH-1 downto 0);
    value    : out std_logic_vector(WIDTH-1 downto 0);
    bit_out  : out std_logic
  );
end entity;

architecture rtl of bbq_lfsr_core is
  signal state : std_logic_vector(WIDTH-1 downto 0) := SEED;
begin
  assert WIDTH >= 2 report "WIDTH must be at least 2" severity failure;
  assert SEED /= (SEED'range => '0') report "LFSR seed must be nonzero" severity failure;

  value <= state;
  bit_out <= state(0);

  process(clk)
    variable next_state : std_logic_vector(WIDTH-1 downto 0);
  begin
    if rising_edge(clk) then
      if rst_n = '0' then
        state <= SEED;
      elsif load = '1' then
        if seed_in = (seed_in'range => '0') then state <= SEED; else state <= seed_in; end if;
      elsif enable = '1' then
        next_state := '0' & state(WIDTH-1 downto 1);
        if state(0) = '1' then next_state := next_state xor POLY_MASK; end if;
        state <= next_state;
      end if;
    end if;
  end process;
end architecture;
