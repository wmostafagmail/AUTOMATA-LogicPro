-- Deterministic generated wrapper. Do not edit manually.
-- Source block: crc_checker_single_cycle
-- Configuration ID: CRC_CHECKER_SINGLE_CYCLE_5883AB429702D269
-- Source: rtl/blocks/reductions_and_checksums/crc_checker_single_cycle.vhd
library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity crc_checker_single_cycle_det_cfg is
  generic (
    DATA_WIDTH : positive := 8;
    G_CONFIG_SCHEMA : natural := 1;
    G_CONFIG_ID : string := "CRC_CHECKER_SINGLE_CYCLE_5883AB429702D269"
  );
  port (
    clk : in std_logic;
    rst_n : in std_logic;
    clear : in std_logic;
    data_in : in std_logic_vector(DATA_WIDTH-1 downto 0);
    data_valid : in std_logic;
    crc_out : out std_logic_vector(31 downto 0);
    crc_valid : out std_logic
  );
end entity;

architecture deterministic_wrapper of crc_checker_single_cycle_det_cfg is
begin
  assert G_CONFIG_SCHEMA = 1 report "Unsupported deterministic configuration schema" severity failure;
  assert DATA_WIDTH = 8 report "Locked deterministic configuration mismatch: DATA_WIDTH" severity failure;

  u_block : entity work.crc_checker_single_cycle
    generic map (
      DATA_WIDTH => DATA_WIDTH
    )
    port map (
      clk => clk,
      rst_n => rst_n,
      clear => clear,
      data_in => data_in,
      data_valid => data_valid,
      crc_out => crc_out,
      crc_valid => crc_valid
    );
end architecture;
