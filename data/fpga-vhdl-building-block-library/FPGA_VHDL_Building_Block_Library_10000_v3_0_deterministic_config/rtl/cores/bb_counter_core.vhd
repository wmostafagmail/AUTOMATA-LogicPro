library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity bb_counter_core is
  generic (
    COUNT_WIDTH : positive := 32;
    MODULUS     : positive := 2**16;
    STEP        : positive := 1;
    SATURATING  : boolean := false;
    DOWN_COUNT  : boolean := false
  );
  port (
    clk            : in  std_logic;
    rst_n          : in  std_logic;
    enable         : in  std_logic;
    load           : in  std_logic;
    load_value     : in  std_logic_vector(COUNT_WIDTH-1 downto 0);
    clear          : in  std_logic;
    count          : out std_logic_vector(COUNT_WIDTH-1 downto 0);
    terminal_count : out std_logic;
    overflow       : out std_logic
  );
end entity;

architecture rtl of bb_counter_core is
  signal count_reg : unsigned(COUNT_WIDTH-1 downto 0) := (others => '0');
  signal tc_reg, ov_reg : std_logic := '0';
begin
  count <= std_logic_vector(count_reg);
  terminal_count <= tc_reg;
  overflow <= ov_reg;

  process(clk)
    variable next_value : unsigned(COUNT_WIDTH-1 downto 0);
    variable mod_value  : unsigned(COUNT_WIDTH-1 downto 0);
  begin
    if rising_edge(clk) then
      tc_reg <= '0';
      ov_reg <= '0';
      mod_value := to_unsigned(MODULUS-1, COUNT_WIDTH);
      if rst_n = '0' or clear = '1' then
        count_reg <= (others => '0');
      elsif load = '1' then
        count_reg <= unsigned(load_value);
      elsif enable = '1' then
        if DOWN_COUNT then
          if count_reg < STEP then
            tc_reg <= '1';
            ov_reg <= '1';
            if SATURATING then
              count_reg <= (others => '0');
            else
              count_reg <= mod_value;
            end if;
          else
            count_reg <= count_reg - STEP;
          end if;
        else
          next_value := count_reg + STEP;
          if count_reg >= mod_value or next_value > mod_value then
            tc_reg <= '1';
            ov_reg <= '1';
            if SATURATING then
              count_reg <= mod_value;
            else
              count_reg <= (others => '0');
            end if;
          else
            count_reg <= next_value;
          end if;
        end if;
      end if;
    end if;
  end process;
end architecture;
