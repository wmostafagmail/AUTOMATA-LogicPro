-- Deterministic generated wrapper. Do not edit manually.
-- Source block: delay_and_sum_beamformer_combinational
-- Configuration ID: DELAY_AND_SUM_BEAMFORMER_COMBINATIONAL_D2E0FABCBC9CD383
-- Source: rtl/blocks/beamforming/delay_and_sum_beamformer_combinational.vhd
library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity delay_and_sum_beamformer_combinational_det_cfg is
  generic (
    DATA_WIDTH : positive := 32;
    RESULT_WIDTH : positive := 32;
    SIGNED_MODE : boolean := false;
    G_CONFIG_SCHEMA : natural := 1;
    G_CONFIG_ID : string := "DELAY_AND_SUM_BEAMFORMER_COMBINATIONAL_D2E0FABCBC9CD383"
  );
  port (
    clk : in std_logic;
    rst_n : in std_logic;
    in_a : in std_logic_vector(DATA_WIDTH-1 downto 0);
    in_b : in std_logic_vector(DATA_WIDTH-1 downto 0);
    in_valid : in std_logic;
    in_ready : out std_logic;
    result : out std_logic_vector(RESULT_WIDTH-1 downto 0);
    out_valid : out std_logic;
    out_ready : in std_logic;
    error : out std_logic
  );
end entity;

architecture deterministic_wrapper of delay_and_sum_beamformer_combinational_det_cfg is
begin
  assert G_CONFIG_SCHEMA = 1 report "Unsupported deterministic configuration schema" severity failure;
  assert DATA_WIDTH = 32 report "Locked deterministic configuration mismatch: DATA_WIDTH" severity failure;
  assert RESULT_WIDTH = 32 report "Locked deterministic configuration mismatch: RESULT_WIDTH" severity failure;
  assert SIGNED_MODE = false report "Locked deterministic configuration mismatch: SIGNED_MODE" severity failure;

  u_block : entity work.delay_and_sum_beamformer_combinational
    generic map (
      DATA_WIDTH => DATA_WIDTH,
      RESULT_WIDTH => RESULT_WIDTH,
      SIGNED_MODE => SIGNED_MODE
    )
    port map (
      clk => clk,
      rst_n => rst_n,
      in_a => in_a,
      in_b => in_b,
      in_valid => in_valid,
      in_ready => in_ready,
      result => result,
      out_valid => out_valid,
      out_ready => out_ready,
      error => error
    );
end architecture;
