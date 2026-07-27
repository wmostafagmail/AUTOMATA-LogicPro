library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use work.bb_util_pkg.all;

entity bbq_round_robin_arbiter_core is
  generic (PORTS : positive := 4);
  port (
    clk         : in  std_logic;
    rst_n       : in  std_logic;
    accept      : in  std_logic;
    request     : in  std_logic_vector(PORTS-1 downto 0);
    grant       : out std_logic_vector(PORTS-1 downto 0);
    grant_valid : out std_logic;
    grant_index : out std_logic_vector(clog2(PORTS)-1 downto 0)
  );
end entity;

architecture rtl of bbq_round_robin_arbiter_core is
  signal pointer         : natural range 0 to PORTS-1 := 0;
  signal selected_index  : natural range 0 to PORTS-1 := 0;
  signal selected_valid  : std_logic := '0';
begin
  assert PORTS >= 2 report "PORTS must be at least 2" severity failure;

  process(all)
    variable found : boolean;
    variable idx   : natural range 0 to PORTS-1;
    variable gv    : std_logic_vector(PORTS-1 downto 0);
    variable selv  : natural range 0 to PORTS-1;
  begin
    found := false;
    gv := (others => '0');
    selv := pointer;
    for offset in 0 to PORTS-1 loop
      idx := (pointer + offset) mod PORTS;
      if (not found) and request(idx) = '1' then
        found := true;
        gv(idx) := '1';
        selv := idx;
      end if;
    end loop;

    grant <= gv;
    selected_index <= selv;
    if found then selected_valid <= '1'; else selected_valid <= '0'; end if;
  end process;

  grant_valid <= selected_valid;
  grant_index <= std_logic_vector(to_unsigned(selected_index, grant_index'length));

  process(clk)
  begin
    if rising_edge(clk) then
      if rst_n = '0' then
        pointer <= 0;
      elsif accept = '1' and selected_valid = '1' then
        pointer <= (selected_index + 1) mod PORTS;
      end if;
    end if;
  end process;
end architecture;
