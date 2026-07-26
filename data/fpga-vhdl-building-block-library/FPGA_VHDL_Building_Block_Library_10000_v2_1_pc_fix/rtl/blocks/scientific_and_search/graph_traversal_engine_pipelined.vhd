-- Auto-generated from FPGA Building Block Catalog BB-1806
-- Block: graph_traversal_engine_pipelined
-- Category: Scientific and Search / Domain accelerators
-- Implementation tier: B
-- Verification status: static-validated source; run supplied GHDL regression before release.
-- Protocol status: not_applicable_or_internal_contract
-- Timing status: requires synthesis, place-and-route, and constraints for the selected FPGA/clock
-- CDC status: single_clock_default; integration CDC review required
-- Numerical status: application-specific; reference model required
library ieee; use ieee.std_logic_1164.all;
entity graph_traversal_engine_pipelined is generic(DATA_WIDTH:positive:=32;XOR_MASK:natural:=170);port(clk,rst_n:in std_logic;s_data:in std_logic_vector(DATA_WIDTH-1 downto 0);s_valid:in std_logic;s_ready:out std_logic;s_last:in std_logic;m_data:out std_logic_vector(DATA_WIDTH-1 downto 0);m_valid:out std_logic;m_ready:in std_logic;m_last:out std_logic);end entity;
architecture rtl of graph_traversal_engine_pipelined is begin u_core:entity work.bb_stream_core generic map(DATA_WIDTH=>DATA_WIDTH,XOR_MASK=>XOR_MASK) port map(clk=>clk,rst_n=>rst_n,s_data=>s_data,s_valid=>s_valid,s_ready=>s_ready,s_last=>s_last,m_data=>m_data,m_valid=>m_valid,m_ready=>m_ready,m_last=>m_last);end architecture;
