library ieee;
use ieee.std_logic_1164.all;

entity bb_crc32_core is
  generic (
    DATA_WIDTH : positive := 8
  );
  port (
    clk       : in  std_logic;
    rst_n     : in  std_logic;
    clear     : in  std_logic;
    data_in   : in  std_logic_vector(DATA_WIDTH-1 downto 0);
    data_valid: in  std_logic;
    crc_out   : out std_logic_vector(31 downto 0);
    crc_valid : out std_logic
  );
end entity;

architecture rtl of bb_crc32_core is
  signal crc_reg : std_logic_vector(31 downto 0) := (others => '1');
  signal valid_reg : std_logic := '0';

  function next_crc(data : std_logic_vector; crc : std_logic_vector(31 downto 0))
    return std_logic_vector is
    variable c : std_logic_vector(31 downto 0) := crc;
    variable feedback : std_logic;
  begin
    for i in data'range loop
      feedback := c(31) xor data(i);
      c := c(30 downto 0) & '0';
      if feedback = '1' then
        c := c xor x"04C11DB7";
      end if;
    end loop;
    return c;
  end function;
begin
  crc_out <= not crc_reg;
  crc_valid <= valid_reg;
  process(clk)
  begin
    if rising_edge(clk) then
      valid_reg <= '0';
      if rst_n = '0' or clear = '1' then
        crc_reg <= (others => '1');
      elsif data_valid = '1' then
        crc_reg <= next_crc(data_in, crc_reg);
        valid_reg <= '1';
      end if;
    end if;
  end process;
end architecture;
