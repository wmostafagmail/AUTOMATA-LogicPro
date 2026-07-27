library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
entity bb_sensor_core is
  generic (SENSOR_WIDTH : positive := 16; DATA_WIDTH : positive := 32; THRESHOLD : natural := 100);
  port (clk, rst_n : in std_logic; trigger : in std_logic; sensor_in : in std_logic_vector(SENSOR_WIDTH-1 downto 0);
        sample_out : out std_logic_vector(DATA_WIDTH-1 downto 0); sample_valid, event_irq : out std_logic);
end entity;
architecture rtl of bb_sensor_core is signal d: std_logic_vector(DATA_WIDTH-1 downto 0):=(others=>'0'); signal v,i:std_logic:='0';
begin sample_out<=d; sample_valid<=v; event_irq<=i;
  process(clk) begin if rising_edge(clk) then v<='0'; i<='0'; if rst_n='0' then d<=(others=>'0');
  elsif trigger='1' then d<=std_logic_vector(resize(unsigned(sensor_in),DATA_WIDTH)); v<='1'; if unsigned(sensor_in)>=THRESHOLD then i<='1'; end if; end if; end if; end process;
end architecture;
