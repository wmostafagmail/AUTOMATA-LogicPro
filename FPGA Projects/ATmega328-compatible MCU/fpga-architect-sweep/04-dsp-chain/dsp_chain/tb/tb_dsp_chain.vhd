library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use std.env.all;

entity tb_dsp_chain is
end entity;

architecture sim of tb_dsp_chain is
  constant CLK_PERIOD : time := 10 ns;
  signal clk : std_logic := '0';
  signal rst_n : std_logic := '0';
  signal in_valid : std_logic := '0';
  signal in_data : std_logic_vector(15 downto 0) := (others => '0');
  signal out_valid : std_logic;
  signal out_data : std_logic_vector(15 downto 0);

  procedure check_valid(constant label_text : in string; constant got        : in std_logic; variable failed_io : inout boolean) is
  begin
    if got /= '1' then
      failed_io := true;
      report "FAIL " & label_text & " expected valid='1'" severity error;
    end if;
  end procedure;

begin
  clk <= not clk after CLK_PERIOD / 2;

  stimulus : process
    variable failed : boolean := false;
  begin
    rst_n <= '0';
    in_valid <= '0';
    wait for 20 ns;
    rst_n <= '1';
    wait until rising_edge(clk);
    
    -- Apply stimulus
    in_valid <= '1';
    in_data <= std_logic_vector(to_unsigned(1, 16));
    wait until rising_edge(clk);
    in_valid <= '0';
    in_data <= std_logic_vector(to_unsigned(2, 16));
    wait until rising_edge(clk);
    in_valid <= '1';
    in_data <= std_logic_vector(to_unsigned(3, 16));
    wait until rising_edge(clk);
    in_valid <= '0';
    in_data <= std_logic_vector(to_unsigned(4, 16));
    wait until rising_edge(clk);
    in_valid <= '1';
    in_data <= std_logic_vector(to_unsigned(5, 16));
    wait until rising_edge(clk);
    in_valid <= '0';

    -- Wait for output
    wait until out_valid = '1';
    check_valid("output_valid", out_valid, failed);
    
    if failed then
      report "TEST FAILED" severity failure;
    else
      report "TEST PASSED" severity note;
      std.env.stop(0);
    end if;
  end process;
end architecture;