library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

use work.avr_pkg.all;

entity avr_sreg is
  port (
    clk            : in  std_logic;
    reset          : in  std_logic;
    flags_we_i     : in  std_logic;
    flags_next_i   : in  sreg_t;
    bit_set_we_i   : in  std_logic;
    bit_clr_we_i   : in  std_logic;
    bit_idx_i      : in  bit_idx3_t;
    t_load_we_i    : in  std_logic;
    t_value_i      : in  std_logic;
    i_set_i        : in  std_logic;
    i_clr_i        : in  std_logic;
    sreg_q_o       : out sreg_t
  );
end entity;

architecture rtl of avr_sreg is
  signal sreg_q : sreg_t := (others => '0');
begin
  process(clk)
    variable next_v : sreg_t;
  begin
    if rising_edge(clk) then
      if reset = '1' then
        sreg_q <= (others => '0');
      else
        next_v := sreg_q;

        if flags_we_i = '1' then
          next_v := flags_next_i;
        end if;

        if bit_set_we_i = '1' then
          next_v(to_integer(unsigned(bit_idx_i))) := '1';
        end if;

        if bit_clr_we_i = '1' then
          next_v(to_integer(unsigned(bit_idx_i))) := '0';
        end if;

        if t_load_we_i = '1' then
          next_v(6) := t_value_i;
        end if;

        if i_set_i = '1' then
          next_v(7) := '1';
        end if;

        if i_clr_i = '1' then
          next_v(7) := '0';
        end if;

        sreg_q <= next_v;
      end if;
    end if;
  end process;

  sreg_q_o <= sreg_q;
end architecture;
