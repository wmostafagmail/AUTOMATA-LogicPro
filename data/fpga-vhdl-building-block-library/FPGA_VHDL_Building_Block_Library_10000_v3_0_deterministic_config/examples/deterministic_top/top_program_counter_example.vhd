library ieee;
use ieee.std_logic_1164.all;

entity top_program_counter_example is
  port (
    clk         : in  std_logic;
    rst_n       : in  std_logic;
    redirect    : in  std_logic;
    redirect_pc : in  std_logic_vector(63 downto 0);
    pc          : out std_logic_vector(63 downto 0)
  );
end entity;

architecture rtl of top_program_counter_example is
  signal pc_next  : std_logic_vector(63 downto 0);
  signal pc_valid : std_logic;
begin
  u_pc : entity work.program_counter_64bit_cfg
    port map (
      clk                => clk,
      rst_n              => rst_n,
      stall              => '0',
      sequential_advance => '1',
      redirect_valid     => redirect,
      redirect_pc        => redirect_pc,
      pc_current         => pc,
      pc_next            => pc_next,
      pc_valid           => pc_valid
    );
end architecture;
