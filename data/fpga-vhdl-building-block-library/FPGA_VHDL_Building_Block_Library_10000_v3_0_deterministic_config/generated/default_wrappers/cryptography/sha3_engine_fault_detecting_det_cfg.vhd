-- Deterministic generated wrapper. Do not edit manually.
-- Source block: sha3_engine_fault_detecting
-- Configuration ID: SHA3_ENGINE_FAULT_DETECTING_19BA769D9D3AE089
-- Source: rtl/blocks/cryptography/sha3_engine_fault_detecting.vhd
library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity sha3_engine_fault_detecting_det_cfg is
  generic (
    DATA_WIDTH : positive := 128;
    KEY_WIDTH : positive := 128;
    G_CONFIG_SCHEMA : natural := 1;
    G_CONFIG_ID : string := "SHA3_ENGINE_FAULT_DETECTING_19BA769D9D3AE089"
  );
  port (
    clk : in std_logic;
    rst_n : in std_logic;
    data_in : in std_logic_vector(DATA_WIDTH-1 downto 0);
    key_in : in std_logic_vector(KEY_WIDTH-1 downto 0);
    in_valid : in std_logic;
    in_ready : out std_logic;
    data_out : out std_logic_vector(DATA_WIDTH-1 downto 0);
    out_valid : out std_logic;
    out_ready : in std_logic;
    fault : out std_logic
  );
end entity;

architecture deterministic_wrapper of sha3_engine_fault_detecting_det_cfg is
begin
  assert G_CONFIG_SCHEMA = 1 report "Unsupported deterministic configuration schema" severity failure;
  assert DATA_WIDTH = 128 report "Locked deterministic configuration mismatch: DATA_WIDTH" severity failure;
  assert KEY_WIDTH = 128 report "Locked deterministic configuration mismatch: KEY_WIDTH" severity failure;

  u_block : entity work.sha3_engine_fault_detecting
    generic map (
      DATA_WIDTH => DATA_WIDTH,
      KEY_WIDTH => KEY_WIDTH
    )
    port map (
      clk => clk,
      rst_n => rst_n,
      data_in => data_in,
      key_in => key_in,
      in_valid => in_valid,
      in_ready => in_ready,
      data_out => data_out,
      out_valid => out_valid,
      out_ready => out_ready,
      fault => fault
    );
end architecture;
