-- Deterministic generated wrapper. Do not edit manually.
-- Source block: deadtime_inserter_continuous
-- Configuration ID: DEADTIME_INSERTER_CONTINUOUS_E2D642F99B267D03
-- Source: rtl/blocks/motor_and_power_control/deadtime_inserter_continuous.vhd
library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity deadtime_inserter_continuous_det_cfg is
  generic (
    WIDTH : positive := 16;
    G_CONFIG_SCHEMA : natural := 1;
    G_CONFIG_ID : string := "DEADTIME_INSERTER_CONTINUOUS_E2D642F99B267D03"
  );
  port (
    clk : in std_logic;
    rst_n : in std_logic;
    enable : in std_logic;
    period : in std_logic_vector(WIDTH-1 downto 0);
    duty : in std_logic_vector(WIDTH-1 downto 0);
    pwm_out : out std_logic;
    period_tick : out std_logic
  );
end entity;

architecture deterministic_wrapper of deadtime_inserter_continuous_det_cfg is
begin
  assert G_CONFIG_SCHEMA = 1 report "Unsupported deterministic configuration schema" severity failure;
  assert WIDTH = 16 report "Locked deterministic configuration mismatch: WIDTH" severity failure;

  u_block : entity work.deadtime_inserter_continuous
    generic map (
      WIDTH => WIDTH
    )
    port map (
      clk => clk,
      rst_n => rst_n,
      enable => enable,
      period => period,
      duty => duty,
      pwm_out => pwm_out,
      period_tick => period_tick
    );
end architecture;
