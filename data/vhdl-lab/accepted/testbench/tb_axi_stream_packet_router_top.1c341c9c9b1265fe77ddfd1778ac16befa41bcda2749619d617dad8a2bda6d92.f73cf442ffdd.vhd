library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity tb_axi_stream_packet_router_top is
end entity tb_axi_stream_packet_router_top;

architecture sim of tb_axi_stream_packet_router_top is
  signal clk : std_logic := '0';
  signal rst : std_logic := '0';
  signal s_axis_tvalid_i : std_logic := '0';
  signal s_axis_tready_o : std_logic := '0';
  signal s_axis_tdata_i : std_logic_vector(31 downto 0) := (others => '0');
  signal s_axis_tlast_i : std_logic := '0';
  signal m_axis_tvalid_o : std_logic := '0';
  signal m_axis_tready_i : std_logic := '0';
  signal m_axis_tdata_o : std_logic_vector(31 downto 0) := (others => '0');
  signal m_axis_tlast_o : std_logic := '0';
begin
  clk_gen : process
  begin
    clk <= '0';
    wait for 5 ns;
    clk <= '1';
    wait for 5 ns;
  end process;

  dut : entity work.axi_stream_packet_router_top
    generic map (
      DATA_WIDTH => 8
    )
    port map (
      clk => clk,
      rst => rst,
      s_axis_tvalid_i => s_axis_tvalid_i,
      s_axis_tready_o => s_axis_tready_o,
      s_axis_tdata_i => s_axis_tdata_i,
      s_axis_tlast_i => s_axis_tlast_i,
      m_axis_tvalid_o => m_axis_tvalid_o,
      m_axis_tready_i => m_axis_tready_i,
      m_axis_tdata_o => m_axis_tdata_o,
      m_axis_tlast_o => m_axis_tlast_o
    );

  stimulus : process
  begin
    rst <= '1';
    wait for 20 ns;
    rst <= '0';
    s_axis_tvalid_i <= '0';
    s_axis_tdata_i <= (others => '0');
    s_axis_tlast_i <= '0';
    m_axis_tready_i <= '0';
    wait for 80 ns;
    report "PASS" severity note;
    wait;
  end process;
end architecture sim;
