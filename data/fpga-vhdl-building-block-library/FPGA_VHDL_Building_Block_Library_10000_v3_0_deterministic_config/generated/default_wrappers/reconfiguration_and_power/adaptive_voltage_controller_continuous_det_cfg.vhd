-- Deterministic generated wrapper. Do not edit manually.
-- Source block: adaptive_voltage_controller_continuous
-- Configuration ID: ADAPTIVE_VOLTAGE_CONTROLLER_CONTINUOUS_D8F16E717B6EAAD6
-- Source: rtl/blocks/reconfiguration_and_power/adaptive_voltage_controller_continuous.vhd
library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity adaptive_voltage_controller_continuous_det_cfg is
  generic (
    CMD_WIDTH : positive := 8;
    CFG_WIDTH : positive := 32;
    STATUS_WIDTH : positive := 32;
    LATENCY_CYCLES : positive := 4;
    G_CONFIG_SCHEMA : natural := 1;
    G_CONFIG_ID : string := "ADAPTIVE_VOLTAGE_CONTROLLER_CONTINUOUS_D8F16E717B6EAAD6"
  );
  port (
    clk : in std_logic;
    rst_n : in std_logic;
    start : in std_logic;
    abort : in std_logic;
    command : in std_logic_vector(CMD_WIDTH-1 downto 0);
    cfg : in std_logic_vector(CFG_WIDTH-1 downto 0);
    busy : out std_logic;
    done : out std_logic;
    error : out std_logic;
    status : out std_logic_vector(STATUS_WIDTH-1 downto 0)
  );
end entity;

architecture deterministic_wrapper of adaptive_voltage_controller_continuous_det_cfg is
begin
  assert G_CONFIG_SCHEMA = 1 report "Unsupported deterministic configuration schema" severity failure;
  assert CMD_WIDTH = 8 report "Locked deterministic configuration mismatch: CMD_WIDTH" severity failure;
  assert CFG_WIDTH = 32 report "Locked deterministic configuration mismatch: CFG_WIDTH" severity failure;
  assert STATUS_WIDTH = 32 report "Locked deterministic configuration mismatch: STATUS_WIDTH" severity failure;
  assert LATENCY_CYCLES = 4 report "Locked deterministic configuration mismatch: LATENCY_CYCLES" severity failure;

  u_block : entity work.adaptive_voltage_controller_continuous
    generic map (
      CMD_WIDTH => CMD_WIDTH,
      CFG_WIDTH => CFG_WIDTH,
      STATUS_WIDTH => STATUS_WIDTH,
      LATENCY_CYCLES => LATENCY_CYCLES
    )
    port map (
      clk => clk,
      rst_n => rst_n,
      start => start,
      abort => abort,
      command => command,
      cfg => cfg,
      busy => busy,
      done => done,
      error => error,
      status => status
    );
end architecture;
