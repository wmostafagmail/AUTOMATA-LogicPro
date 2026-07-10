library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity register_file is
  generic (
    REGISTER_COUNT : integer := 4;
    REGISTER_WIDTH : integer := 8
  );
  port (
    clk        : in  std_logic;
    reset_n    : in  std_logic;
    write_en   : in  std_logic;
    write_addr : in  std_logic_vector(1 downto 0);
    write_data : in  std_logic_vector(7 downto 0);
    read_addr1 : in  std_logic_vector(1 downto 0);
    read_addr2 : in  std_logic_vector(1 downto 0);
    read_data1 : out std_logic_vector(7 downto 0);
    read_data2 : out std_logic_vector(7 downto 0)
  );
end entity register_file;

architecture rtl of register_file is
  type reg_array_t is array (0 to REGISTER_COUNT - 1) of std_logic_vector(REGISTER_WIDTH - 1 downto 0);
  signal registers : reg_array_t := (others => (others => '0'));
begin

  process(clk, reset_n)
    variable idx_w : integer range 0 to REGISTER_COUNT - 1;
  begin
    if reset_n = '0' then
      for i in 0 to REGISTER_COUNT - 1 loop
        registers(i) <= (others => '0');
      end loop;
    elsif rising_edge(clk) then
      idx_w := to_integer(unsigned(write_addr));
      if idx_w < REGISTER_COUNT then
        if write_en = '1' then
          registers(idx_w) <= write_data;
        end if;
      end if;
    end if;
  end process;

  process(read_addr1, read_addr2, registers)
    variable idx_r1 : integer range 0 to REGISTER_COUNT - 1;
    variable idx_r2 : integer range 0 to REGISTER_COUNT - 1;
  begin
    idx_r1 := to_integer(unsigned(read_addr1));
    idx_r2 := to_integer(unsigned(read_addr2));

    if idx_r1 < REGISTER_COUNT then
      read_data1 <= registers(idx_r1);
    else
      read_data1 <= (others => '0');
    end if;

    if idx_r2 < REGISTER_COUNT then
      read_data2 <= registers(idx_r2);
    else
      read_data2 <= (others => '0');
    end if;
  end process;

end architecture rtl;