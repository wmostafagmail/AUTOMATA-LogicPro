library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity bb_stream_core is
  generic (
    DATA_WIDTH : positive := 32;
    XOR_MASK   : natural := 0
  );
  port (
    clk     : in  std_logic;
    rst_n   : in  std_logic;
    s_data  : in  std_logic_vector(DATA_WIDTH-1 downto 0);
    s_valid : in  std_logic;
    s_ready : out std_logic;
    s_last  : in  std_logic;
    m_data  : out std_logic_vector(DATA_WIDTH-1 downto 0);
    m_valid : out std_logic;
    m_ready : in  std_logic;
    m_last  : out std_logic
  );
end entity;

architecture rtl of bb_stream_core is
  signal data_reg : std_logic_vector(DATA_WIDTH-1 downto 0) := (others => '0');
  signal valid_reg, last_reg : std_logic := '0';
  constant MASK : std_logic_vector(DATA_WIDTH-1 downto 0) := std_logic_vector(to_unsigned(XOR_MASK, DATA_WIDTH));
begin
  s_ready <= (not valid_reg) or m_ready;
  m_data <= data_reg;
  m_valid <= valid_reg;
  m_last <= last_reg;

  process(clk)
  begin
    if rising_edge(clk) then
      if rst_n = '0' then
        data_reg <= (others => '0');
        valid_reg <= '0';
        last_reg <= '0';
      elsif ((not valid_reg) or m_ready) = '1' then
        valid_reg <= s_valid;
        if s_valid = '1' then
          data_reg <= s_data xor MASK;
          last_reg <= s_last;
        end if;
      end if;
    end if;
  end process;
end architecture;
