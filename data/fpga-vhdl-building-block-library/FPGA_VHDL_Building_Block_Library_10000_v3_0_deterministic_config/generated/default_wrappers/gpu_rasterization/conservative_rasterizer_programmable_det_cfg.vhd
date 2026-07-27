-- Deterministic generated wrapper. Do not edit manually.
-- Source block: conservative_rasterizer_programmable
-- Configuration ID: CONSERVATIVE_RASTERIZER_PROGRAMMABLE_0DE02BB6EBCEAA59
-- Source: rtl/blocks/gpu_rasterization/conservative_rasterizer_programmable.vhd
library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity conservative_rasterizer_programmable_det_cfg is
  generic (
    DATA_WIDTH : positive := 24;
    GAIN_SHIFT : natural := 0;
    G_CONFIG_SCHEMA : natural := 1;
    G_CONFIG_ID : string := "CONSERVATIVE_RASTERIZER_PROGRAMMABLE_0DE02BB6EBCEAA59"
  );
  port (
    clk : in std_logic;
    rst_n : in std_logic;
    sample_in : in std_logic_vector(DATA_WIDTH-1 downto 0);
    in_valid : in std_logic;
    in_ready : out std_logic;
    sample_out : out std_logic_vector(DATA_WIDTH-1 downto 0);
    out_valid : out std_logic;
    out_ready : in std_logic
  );
end entity;

architecture deterministic_wrapper of conservative_rasterizer_programmable_det_cfg is
begin
  assert G_CONFIG_SCHEMA = 1 report "Unsupported deterministic configuration schema" severity failure;
  assert DATA_WIDTH = 24 report "Locked deterministic configuration mismatch: DATA_WIDTH" severity failure;
  assert GAIN_SHIFT = 0 report "Locked deterministic configuration mismatch: GAIN_SHIFT" severity failure;

  u_block : entity work.conservative_rasterizer_programmable
    generic map (
      DATA_WIDTH => DATA_WIDTH,
      GAIN_SHIFT => GAIN_SHIFT
    )
    port map (
      clk => clk,
      rst_n => rst_n,
      sample_in => sample_in,
      in_valid => in_valid,
      in_ready => in_ready,
      sample_out => sample_out,
      out_valid => out_valid,
      out_ready => out_ready
    );
end architecture;
