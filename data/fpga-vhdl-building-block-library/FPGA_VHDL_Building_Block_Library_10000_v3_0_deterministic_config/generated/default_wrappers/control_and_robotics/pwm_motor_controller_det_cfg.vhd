-- Deterministic generated wrapper. Do not edit manually.
-- Source block: pwm_motor_controller
-- Configuration ID: PWM_MOTOR_CONTROLLER_81E529ED48022D4A
-- Source: rtl/blocks/control_and_robotics/pwm_motor_controller.vhd
library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity pwm_motor_controller_det_cfg is
  generic (
    WIDTH : positive := 16;
    G_CONFIG_SCHEMA : natural := 1;
    G_CONFIG_ID : string := "PWM_MOTOR_CONTROLLER_81E529ED48022D4A"
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

architecture deterministic_wrapper of pwm_motor_controller_det_cfg is
begin
  assert G_CONFIG_SCHEMA = 1 report "Unsupported deterministic configuration schema" severity failure;
  assert WIDTH = 16 report "Locked deterministic configuration mismatch: WIDTH" severity failure;

  u_block : entity work.pwm_motor_controller
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
