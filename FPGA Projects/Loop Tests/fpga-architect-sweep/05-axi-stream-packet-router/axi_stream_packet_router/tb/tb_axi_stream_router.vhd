library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use std.env.all;
use work.axi_stream_pkg.all;

entity tb_axi_stream_router is
end entity tb_axi_stream_router;

architecture sim of tb_axi_stream_router is
  constant CLK_PERIOD : time := 10 ns;
  signal clk   : std_logic := '0';
  signal rst   : std_logic := '0';
  signal in_data  : std_logic_vector(15 downto 0);
  signal in_valid : std_logic := '0';
  signal in_ready : std_logic;
  signal out_data  : std_logic_vector(31 downto 0);
  signal out_valid : std_logic_vector(1 downto 0);
  signal out_ready : std_logic_vector(1 downto 0) := "11";
  
  signal test_failed : boolean := false;
begin
  clk <= not clk after CLK_PERIOD / 2;

  dut : entity work.axi_stream_router
    generic map (NUM_IN => 1)
    port map (
      clk   => clk,
      rst   => rst,
      in_data  => in_data,
      in_valid => in_valid,
      in_ready => in_ready,
      out_data  => out_data,
      out_valid => out_valid,
      out_ready => out_ready
    );

  stimulus_proc : process
  begin
    -- Reset
    rst <= '1';
    in_valid <= '0';
    in_data  <= (others => '0');
    wait for CLK_PERIOD * 2;
    rst <= '0';
    wait for CLK_PERIOD;

    -- Test 1: Nominal routing
    in_valid <= '1';
    in_data  <= x"DEAD";
    wait until rising_edge(clk);
    in_data <= x"BEEF";
    wait until rising_edge(clk);
    in_data <= x"CAFE";
    wait until rising_edge(clk);

    -- Test 2: Backpressure
    out_ready <= "10";
    in_data <= x"1234";
    wait until rising_edge(clk);
    wait until rising_edge(clk);
    out_ready <= "11";
    wait until rising_edge(clk);

    -- Finish
    wait for CLK_PERIOD;
    if test_failed = false then
      std.env.stop(0);
    else
      std.env.stop(1);
    end if;
  end process stimulus_proc;

  check_proc : process (clk)
  begin
    if rising_edge(clk) then
      if rst = '1' then
        assert in_ready = '0' report "Reset: in_ready should be 0" severity error;
        assert out_valid = "00" report "Reset: out_valid should be 00" severity error;
      else
        -- Check nominal routing
        if in_valid = '1' and in_ready = '1' then
          assert (out_valid = "01" or out_valid = "10") report "Routing: exactly one output should be valid" severity error;
        end if;
        
        -- Check backpressure
        if out_ready(1) = '0' and out_valid(1) = '1' then
          assert in_ready = '0' report "Backpressure: in_ready should be 0" severity error;
        end if;
      end if;
    end if;
  end process check_proc;

end architecture sim;