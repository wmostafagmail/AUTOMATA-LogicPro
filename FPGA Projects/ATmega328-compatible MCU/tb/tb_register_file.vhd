library ieee;
use ieee.std_logic_1164.all;

use work.cpu_pkg.all;

entity tb_register_file is
end entity;

architecture sim of tb_register_file is
  signal clk         : std_logic := '0';
  signal reset       : std_logic := '1';
  signal read_addr_a : reg_idx_t := (others => '0');
  signal read_addr_b : reg_idx_t := (others => '0');
  signal read_data_a : byte_t;
  signal read_data_b : byte_t;
  signal write_en    : std_logic := '0';
  signal write_addr  : reg_idx_t := (others => '0');
  signal write_data  : byte_t := (others => '0');
begin
  clk <= not clk after 5 ns;

  dut: entity work.register_file
    port map (
      clk         => clk,
      reset       => reset,
      read_addr_a => read_addr_a,
      read_addr_b => read_addr_b,
      read_data_a => read_data_a,
      read_data_b => read_data_b,
      write_en    => write_en,
      write_addr  => write_addr,
      write_data  => write_data
    );

  process
  begin
    wait for 12 ns;
    reset <= '0';

    write_addr <= "011";
    write_data <= x"55";
    write_en   <= '1';
    wait for 10 ns;
    write_en   <= '0';

    read_addr_a <= "011";
    read_addr_b <= "000";
    wait for 1 ns;
    assert read_data_a = x"55" report "Register file write/read failed" severity failure;
    assert read_data_b = x"00" report "Register file reset value failed" severity failure;

    wait;
  end process;
end architecture;
