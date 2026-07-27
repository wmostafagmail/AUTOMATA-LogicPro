library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity bbq_saturating_add_core is
  generic (
    WIDTH       : positive := 16;
    SIGNED_MODE : boolean  := true
  );
  port (
    a         : in  std_logic_vector(WIDTH-1 downto 0);
    b         : in  std_logic_vector(WIDTH-1 downto 0);
    result    : out std_logic_vector(WIDTH-1 downto 0);
    saturated : out std_logic
  );
end entity;

architecture rtl of bbq_saturating_add_core is
begin
  assert WIDTH >= 2 report "WIDTH must be at least 2" severity failure;

  process(all)
    variable ue       : unsigned(WIDTH downto 0);
    variable sr       : signed(WIDTH-1 downto 0);
    variable sa, sb   : signed(WIDTH-1 downto 0);
    variable r        : std_logic_vector(WIDTH-1 downto 0);
    variable sat      : std_logic;
    variable max_pos  : std_logic_vector(WIDTH-1 downto 0);
    variable min_neg  : std_logic_vector(WIDTH-1 downto 0);
  begin
    max_pos := (others => '1');
    max_pos(WIDTH-1) := '0';
    min_neg := (others => '0');
    min_neg(WIDTH-1) := '1';
    sat := '0';
    r := (others => '0');

    if SIGNED_MODE then
      sa := signed(a);
      sb := signed(b);
      sr := sa + sb;
      if sa(WIDTH-1) = sb(WIDTH-1) and sr(WIDTH-1) /= sa(WIDTH-1) then
        sat := '1';
        if sa(WIDTH-1) = '0' then r := max_pos; else r := min_neg; end if;
      else
        r := std_logic_vector(sr);
      end if;
    else
      ue := ('0' & unsigned(a)) + ('0' & unsigned(b));
      if ue(WIDTH) = '1' then
        sat := '1';
        r := (others => '1');
      else
        r := std_logic_vector(ue(WIDTH-1 downto 0));
      end if;
    end if;

    result <= r;
    saturated <= sat;
  end process;
end architecture;
