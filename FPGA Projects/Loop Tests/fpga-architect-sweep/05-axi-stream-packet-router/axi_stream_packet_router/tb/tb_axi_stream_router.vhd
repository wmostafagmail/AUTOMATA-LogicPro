library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use std.env.all;

entity tb_axi_stream_router is
end entity tb_axi_stream_router;

architecture sim of tb_axi_stream_router is
  constant DATA_WIDTH : integer := 32;
  constant CLK_PERIOD : time := 10 ns;

  signal clk_s                    : std_logic := '0';
  signal rst_s                    : std_logic := '0';
  
  signal s_axis_in0_valid_s : std_logic := '0';
  signal s_axis_in0_ready_s : std_logic;
  signal s_axis_in0_data_s  : std_logic_vector(DATA_WIDTH-1 downto 0) := (others => '0');
  
  signal s_axis_in1_valid_s : std_logic := '0';
  signal s_axis_in1_ready_s : std_logic;
  signal s_axis_in1_data_s  : std_logic_vector(DATA_WIDTH-1 downto 0) := (others => '0');
  
  signal dest_sel_s         : std_logic := '0';
  
  signal m_axis_out_valid_s : std_logic;
  signal m_axis_out_ready_s : std_logic := '0';
  signal m_axis_out_data_s  : std_logic_vector(DATA_WIDTH-1 downto 0);

  -- REPAIRED: Moved function declaration before '  function to_slv(val : integer;
begin' to satisfy GHDL scope rules.
   width : integer) return std_logic_vector is
  begin
    return std_logic_vector(to_unsigned(val, width));
  end function to_slv;

begin
  clk_s <= not clk_s after CLK_PERIOD / 2;

  dut : entity work.axi_stream_router
    generic map (DATA_WIDTH => DATA_WIDTH)
    port map (
      clk_i             => clk_s,
      rst_i             => rst_s,
      
      s_axis_in0_valid_i => s_axis_in0_valid_s,
      s_axis_in0_ready_o => s_axis_in0_ready_s,
      s_axis_in0_data_i  => s_axis_in0_data_s,
      
      s_axis_in1_valid_i => s_axis_in1_valid_s,
      s_axis_in1_ready_o => s_axis_in1_ready_s,
      s_axis_in1_data_i  => s_axis_in1_data_s,
      
      dest_sel_i         => dest_sel_s,
      
      m_axis_out_valid_o => m_axis_out_valid_s,
      m_axis_out_ready_i => m_axis_out_ready_s,
      m_axis_out_data_o  => m_axis_out_data_s
    );

  stim_proc : process
    variable expected_data : std_logic_vector(DATA_WIDTH-1 downto 0);
  begin
    -- Reset sequence
    rst_s <= '1';
    dest_sel_s <= '0';
    wait for 100 ns;
    rst_s <= '0';
    wait for 10 ns;

    -- Test 1: Route In0
    s_axis_in0_valid_s <= '1';
    s_axis_in0_data_s  <= to_slv(16#DEAD#, DATA_WIDTH);
    dest_sel_s         <= '0';
    m_axis_out_ready_s <= '1';
    wait until rising_edge(clk_s);
    expected_data := to_slv(16#DEAD#, DATA_WIDTH);
    assert (m_axis_out_data_s = expected_data)
      report "Test 1 Failed: Data mismatch"
      severity error;
    report "Test 1 Passed" severity note;

    -- Test 2: Route In1
    s_axis_in0_valid_s <= '0';
    s_axis_in1_valid_s <= '1';
    s_axis_in1_data_s  <= to_slv(16#BEEF#, DATA_WIDTH);
    dest_sel_s         <= '1';
    wait until rising_edge(clk_s);
    expected_data := to_slv(16#BEEF#, DATA_WIDTH);
    assert (m_axis_out_data_s = expected_data)
      report "Test 2 Failed: Data mismatch"
      severity error;
    report "Test 2 Passed" severity note;

    -- Test 3: Backpressure on In0
    s_axis_in0_valid_s <= '1';
    s_axis_in0_data_s  <= to_slv(16#CAFE#, DATA_WIDTH);
    dest_sel_s         <= '0';
    m_axis_out_ready_s <= '0';
    wait until rising_edge(clk_s);
    assert (m_axis_out_valid_s = '1')
      report "Test 3 Failed: Valid not propagated"
      severity error;
    m_axis_out_ready_s <= '1';
    wait until rising_edge(clk_s);
    expected_data := to_slv(16#CAFE#, DATA_WIDTH);
    assert (m_axis_out_data_s = expected_data)
      report "Test 3 Failed: Data missing after backpressure"
      severity error;
    report "Test 3 Passed" severity note;

    report "All tests passed successfully." severity note;
    std.env.stop(0);
  end process stim_proc;

end architecture sim;
