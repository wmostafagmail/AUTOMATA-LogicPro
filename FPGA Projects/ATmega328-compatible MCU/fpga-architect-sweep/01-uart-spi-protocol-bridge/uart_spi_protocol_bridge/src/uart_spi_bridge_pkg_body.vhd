library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

package body uart_spi_bridge_pkg is
  function next_state_fn(current : in state_t;
                         rx_active : in std_logic;
                         tx_done : in std_logic) return state_t is
  begin
    case current is
      when ST_IDLE =>
        if rx_active = '1' then
          return ST_RX;
        else
          return ST_IDLE;
        end if;
      when ST_RX =>
        return ST_WAIT;
      when ST_WAIT =>
        return ST_TX;
      when ST_TX =>
        if tx_done = '1' then
          return ST_IDLE;
        else
          return ST_TX;
        end if;
      when others =>
        return ST_IDLE;
    end case;
  end function next_state_fn;
end package body uart_spi_bridge_pkg;