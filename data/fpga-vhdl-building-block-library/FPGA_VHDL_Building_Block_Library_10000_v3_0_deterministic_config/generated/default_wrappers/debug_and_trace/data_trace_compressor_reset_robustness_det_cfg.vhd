-- Deterministic generated wrapper. Do not edit manually.
-- Source block: data_trace_compressor_reset_robustness
-- Configuration ID: DATA_TRACE_COMPRESSOR_RESET_ROBUSTNESS_98F2704769064EB4
-- Source: rtl/blocks/debug_and_trace/data_trace_compressor_reset_robustness.vhd
library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity data_trace_compressor_reset_robustness_det_cfg is
  generic (
    OBS_WIDTH : positive := 32;
    COUNT_WIDTH : positive := 32;
    G_CONFIG_SCHEMA : natural := 1;
    G_CONFIG_ID : string := "DATA_TRACE_COMPRESSOR_RESET_ROBUSTNESS_98F2704769064EB4"
  );
  port (
    clk : in std_logic;
    rst_n : in std_logic;
    observed : in std_logic_vector(OBS_WIDTH-1 downto 0);
    expected : in std_logic_vector(OBS_WIDTH-1 downto 0);
    sample_valid : in std_logic;
    clear : in std_logic;
    match : out std_logic;
    error_count : out std_logic_vector(COUNT_WIDTH-1 downto 0)
  );
end entity;

architecture deterministic_wrapper of data_trace_compressor_reset_robustness_det_cfg is
begin
  assert G_CONFIG_SCHEMA = 1 report "Unsupported deterministic configuration schema" severity failure;
  assert OBS_WIDTH = 32 report "Locked deterministic configuration mismatch: OBS_WIDTH" severity failure;
  assert COUNT_WIDTH = 32 report "Locked deterministic configuration mismatch: COUNT_WIDTH" severity failure;

  u_block : entity work.data_trace_compressor_reset_robustness
    generic map (
      OBS_WIDTH => OBS_WIDTH,
      COUNT_WIDTH => COUNT_WIDTH
    )
    port map (
      clk => clk,
      rst_n => rst_n,
      observed => observed,
      expected => expected,
      sample_valid => sample_valid,
      clear => clear,
      match => match,
      error_count => error_count
    );
end architecture;
