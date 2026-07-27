-- Deterministic generated wrapper. Do not edit manually.
-- Source block: round_robin_arbiter_programmable
-- Configuration ID: ROUND_ROBIN_ARBITER_PROGRAMMABLE_829FEA8FA27940B9
-- Source: rtl/blocks/interconnect_and_noc/round_robin_arbiter_programmable.vhd
library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity round_robin_arbiter_programmable_det_cfg is
  generic (
    ADDR_WIDTH : positive := 32;
    DATA_WIDTH : positive := 32;
    G_CONFIG_SCHEMA : natural := 1;
    G_CONFIG_ID : string := "ROUND_ROBIN_ARBITER_PROGRAMMABLE_829FEA8FA27940B9"
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

architecture deterministic_wrapper of round_robin_arbiter_programmable_det_cfg is
begin
  assert G_CONFIG_SCHEMA = 1 report "Unsupported deterministic configuration schema" severity failure;
  assert ADDR_WIDTH = 32 report "Locked deterministic configuration mismatch: ADDR_WIDTH" severity failure;
  assert DATA_WIDTH = 32 report "Locked deterministic configuration mismatch: DATA_WIDTH" severity failure;

  u_block : entity work.round_robin_arbiter_programmable
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
