-- Auto-generated from FPGA Building Block Catalog BB-3569
-- Block: quality_of_service_scheduler_programmable
-- Category: Interconnect and NoC / Routing, arbitration and switching
-- Implementation tier: B
-- Verification status: static-validated source; run supplied GHDL regression before release.
-- Protocol status: not_applicable_or_internal_contract
-- Timing status: requires synthesis, place-and-route, and constraints for the selected FPGA/clock
-- CDC status: single_clock_default; integration CDC review required
-- Numerical status: application-specific; reference model required
library ieee; use ieee.std_logic_1164.all;
entity quality_of_service_scheduler_programmable is generic(ADDR_WIDTH:positive:=32;DATA_WIDTH:positive:=32);port(clk,rst_n,req_valid:in std_logic;req_ready:out std_logic;req_write:in std_logic;req_addr:in std_logic_vector(ADDR_WIDTH-1 downto 0);req_wdata:in std_logic_vector(DATA_WIDTH-1 downto 0);rsp_valid:out std_logic;rsp_ready:in std_logic;rsp_rdata:out std_logic_vector(DATA_WIDTH-1 downto 0);rsp_error:out std_logic);end entity;
architecture rtl of quality_of_service_scheduler_programmable is begin u_core:entity work.bb_bus_adapter_core generic map(ADDR_WIDTH=>ADDR_WIDTH,DATA_WIDTH=>DATA_WIDTH) port map(clk=>clk,rst_n=>rst_n,req_valid=>req_valid,req_ready=>req_ready,req_write=>req_write,req_addr=>req_addr,req_wdata=>req_wdata,rsp_valid=>rsp_valid,rsp_ready=>rsp_ready,rsp_rdata=>rsp_rdata,rsp_error=>rsp_error);end architecture;
