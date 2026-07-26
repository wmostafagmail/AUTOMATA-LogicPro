library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity bbq_fixed_point_rescale_core is
  generic (
    IN_WIDTH         : positive := 24;
    OUT_WIDTH        : positive := 16;
    SHIFT_RIGHT      : natural  := 8;
    ROUND_TO_NEAREST : boolean  := true;
    SATURATE         : boolean  := true
  );
  port (
    data_in  : in  std_logic_vector(IN_WIDTH-1 downto 0);
    data_out : out std_logic_vector(OUT_WIDTH-1 downto 0);
    overflow : out std_logic
  );
end entity;

architecture rtl of bbq_fixed_point_rescale_core is
begin
  assert OUT_WIDTH >= 2 report "OUT_WIDTH must be at least 2" severity failure;
  assert SHIFT_RIGHT <= IN_WIDTH report "SHIFT_RIGHT exceeds input width" severity failure;

  process(all)
    variable ext      : signed(IN_WIDTH downto 0);
    variable shifted  : signed(IN_WIDTH downto 0);
    variable max_out  : signed(OUT_WIDTH-1 downto 0);
    variable min_out  : signed(OUT_WIDTH-1 downto 0);
    variable max_ext  : signed(IN_WIDTH downto 0);
    variable min_ext  : signed(IN_WIDTH downto 0);
    variable ov       : std_logic;
  begin
    max_out := (others => '1');
    max_out(max_out'high) := '0';
    min_out := (others => '0');
    min_out(min_out'high) := '1';
    max_ext := resize(max_out, max_ext'length);
    min_ext := resize(min_out, min_ext'length);

    ext := resize(signed(data_in), ext'length);
    if ROUND_TO_NEAREST and SHIFT_RIGHT > 0 then
      if ext(ext'high) = '0' then
        ext := ext + shift_left(to_signed(1, ext'length), SHIFT_RIGHT-1);
      else
        ext := ext - shift_left(to_signed(1, ext'length), SHIFT_RIGHT-1);
      end if;
    end if;

    shifted := shift_right(ext, SHIFT_RIGHT);
    ov := '0';
    if shifted > max_ext then
      ov := '1';
      if SATURATE then data_out <= std_logic_vector(max_out);
      else data_out <= std_logic_vector(resize(shifted, OUT_WIDTH)); end if;
    elsif shifted < min_ext then
      ov := '1';
      if SATURATE then data_out <= std_logic_vector(min_out);
      else data_out <= std_logic_vector(resize(shifted, OUT_WIDTH)); end if;
    else
      data_out <= std_logic_vector(resize(shifted, OUT_WIDTH));
    end if;
    overflow <= ov;
  end process;
end architecture;
