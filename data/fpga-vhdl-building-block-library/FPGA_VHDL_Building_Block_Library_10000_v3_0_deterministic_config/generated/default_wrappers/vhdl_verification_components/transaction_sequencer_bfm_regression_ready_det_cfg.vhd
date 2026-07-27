-- Deterministic generated wrapper. Do not edit manually.
-- Source block: transaction_sequencer_bfm_regression_ready
-- Configuration ID: TRANSACTION_SEQUENCER_BFM_REGRESSION_READY_F5FE84833C15FAD7
-- Source: rtl/blocks/vhdl_verification_components/transaction_sequencer_bfm_regression_ready.vhd
library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity transaction_sequencer_bfm_regression_ready_det_cfg is
  generic (
    OBS_WIDTH : positive := 32;
    COUNT_WIDTH : positive := 32;
    G_CONFIG_SCHEMA : natural := 1;
    G_CONFIG_ID : string := "TRANSACTION_SEQUENCER_BFM_REGRESSION_READY_F5FE84833C15FAD7"
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

architecture deterministic_wrapper of transaction_sequencer_bfm_regression_ready_det_cfg is
begin
  assert G_CONFIG_SCHEMA = 1 report "Unsupported deterministic configuration schema" severity failure;
  assert OBS_WIDTH = 32 report "Locked deterministic configuration mismatch: OBS_WIDTH" severity failure;
  assert COUNT_WIDTH = 32 report "Locked deterministic configuration mismatch: COUNT_WIDTH" severity failure;

  u_block : entity work.transaction_sequencer_bfm_regression_ready
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
