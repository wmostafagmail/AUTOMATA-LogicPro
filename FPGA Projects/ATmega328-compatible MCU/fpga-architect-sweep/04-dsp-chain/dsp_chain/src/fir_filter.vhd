library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use work.dsp_chain_pkg.all;

entity fir_filter is
  generic (
    TAP_COUNT : integer := FILTER_TAP_COUNT
  
    ;
    DATA_WIDTH : positive := 8
  );
  port (
    clk_i     : in  std_logic;
    rst_ni    : in  std_logic;
    in_valid_i: in  std_logic;
    in_data_i : in  std_logic_vector(DATA_WIDTH-1 downto 0);
    out_valid_o: out std_logic;
    out_data_o: out std_logic_vector(DATA_WIDTH-1 downto 0)
  );
end entity;

architecture rtl of fir_filter is
  type delay_line_t is array (0 to TAP_COUNT-1) of signed(DATA_WIDTH-1 downto 0);
  signal delay_reg : delay_line_t := (others => (others => '0'));
  signal out_valid_i : std_logic := '0';
begin
  out_valid_o <= out_valid_i;

  process(clk_i)
  begin
    if rising_edge(clk_i) then
      if rst_ni = '0' then
        delay_reg <= (others => (others => '0'));
        out_valid_i <= '0';
      elsif in_valid_i = '1' then
        for i in delay_line_t'range loop
          if i = 0 then
            delay_reg(i) <= resize(signed(in_data_i), DATA_WIDTH);
          else
            delay_reg(i) <= delay_reg(i-1);
          end if;
        end loop;
        out_valid_i <= '1';
      else
        out_valid_i <= '0';
      end if;
    end if;
  end process;
end architecture;