library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

use work.avr_pkg.all;

entity avr_regfile is
  port (
    clk           : in  std_logic;
    reset         : in  std_logic;
    ra_idx_i      : in  reg_idx5_t;
    rb_idx_i      : in  reg_idx5_t;
    rc_idx_i      : in  reg_idx5_t;
    ra_data_o     : out byte_t;
    rb_data_o     : out byte_t;
    rc_data_o     : out byte_t;
    we_i          : in  std_logic;
    wd_idx_i      : in  reg_idx5_t;
    wd_data_i     : in  byte_t;
    we_pair_i     : in  std_logic;
    wd_pair_idx_i : in  reg_idx5_t;
    wd_pair_lo_i  : in  byte_t;
    wd_pair_hi_i  : in  byte_t
  );
end entity;

architecture rtl of avr_regfile is
  type reg_array_t is array (0 to 31) of byte_t;
  signal regs : reg_array_t := (others => (others => '0'));
begin
  process(clk)
    variable pair_idx_v : natural;
  begin
    if rising_edge(clk) then
      if reset = '1' then
        regs <= (others => (others => '0'));
      else
        if we_i = '1' then
          regs(safe_to_natural(wd_idx_i)) <= wd_data_i;
        end if;

        if we_pair_i = '1' then
          pair_idx_v := safe_to_natural(wd_pair_idx_i);
          regs(pair_idx_v) <= wd_pair_lo_i;
          if pair_idx_v < 31 then
            regs(pair_idx_v + 1) <= wd_pair_hi_i;
          end if;
        end if;
      end if;
    end if;
  end process;

  ra_data_o <= regs(safe_to_natural(ra_idx_i));
  rb_data_o <= regs(safe_to_natural(rb_idx_i));
  rc_data_o <= regs(safe_to_natural(rc_idx_i));
end architecture;
