-- Deterministic generated wrapper. Do not edit manually.
-- Source block: ahb_master_monitor
-- Configuration ID: AHB_MASTER_MONITOR_1366BCB4ECF42EB4
-- Source: rtl/blocks/amba_peripheral_buses/ahb_master_monitor.vhd
library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity ahb_master_monitor_det_cfg is
  generic (
    ADDR_WIDTH : positive := 32;
    DATA_WIDTH : positive := 32;
    G_CONFIG_SCHEMA : natural := 1;
    G_CONFIG_ID : string := "AHB_MASTER_MONITOR_1366BCB4ECF42EB4"
  );
  port (
    clk : in std_logic;
    rst_n : in std_logic;
    req_valid : in std_logic;
    req_ready : out std_logic;
    req_write : in std_logic;
    req_addr : in std_logic_vector(ADDR_WIDTH-1 downto 0);
    req_wdata : in std_logic_vector(DATA_WIDTH-1 downto 0);
    rsp_valid : out std_logic;
    rsp_ready : in std_logic;
    rsp_rdata : out std_logic_vector(DATA_WIDTH-1 downto 0);
    rsp_error : out std_logic
  );
end entity;

architecture deterministic_wrapper of ahb_master_monitor_det_cfg is
begin
  assert G_CONFIG_SCHEMA = 1 report "Unsupported deterministic configuration schema" severity failure;
  assert ADDR_WIDTH = 32 report "Locked deterministic configuration mismatch: ADDR_WIDTH" severity failure;
  assert DATA_WIDTH = 32 report "Locked deterministic configuration mismatch: DATA_WIDTH" severity failure;

  u_block : entity work.ahb_master_monitor
    generic map (
      ADDR_WIDTH => ADDR_WIDTH,
      DATA_WIDTH => DATA_WIDTH
    )
    port map (
      clk => clk,
      rst_n => rst_n,
      req_valid => req_valid,
      req_ready => req_ready,
      req_write => req_write,
      req_addr => req_addr,
      req_wdata => req_wdata,
      rsp_valid => rsp_valid,
      rsp_ready => rsp_ready,
      rsp_rdata => rsp_rdata,
      rsp_error => rsp_error
    );
end architecture;
