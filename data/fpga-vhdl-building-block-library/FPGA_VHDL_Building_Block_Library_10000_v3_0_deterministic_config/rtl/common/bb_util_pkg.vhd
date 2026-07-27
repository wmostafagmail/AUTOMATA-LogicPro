library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

package bb_util_pkg is
  function clog2(n : positive) return natural;
  function is_power_of_two(n : positive) return boolean;
  function xor_reduce(v : std_logic_vector) return std_logic;
  function popcount(v : std_logic_vector) return natural;
  function limited_shift_amount(v : std_logic_vector; maximum : natural) return natural;
  function op_code_from_name_hash(hash_value : natural) return natural;
end package;

package body bb_util_pkg is
  function clog2(n : positive) return natural is
    variable value : natural := n - 1;
    variable result : natural := 0;
  begin
    while value > 0 loop
      value := value / 2;
      result := result + 1;
    end loop;
    return result;
  end function;

  function is_power_of_two(n : positive) return boolean is
    variable value : natural := n;
  begin
    while (value mod 2 = 0) and (value > 1) loop
      value := value / 2;
    end loop;
    return value = 1;
  end function;

  function xor_reduce(v : std_logic_vector) return std_logic is
    variable r : std_logic := '0';
  begin
    for i in v'range loop
      r := r xor v(i);
    end loop;
    return r;
  end function;

  function popcount(v : std_logic_vector) return natural is
    variable r : natural := 0;
  begin
    for i in v'range loop
      if v(i) = '1' then
        r := r + 1;
      end if;
    end loop;
    return r;
  end function;

  function limited_shift_amount(v : std_logic_vector; maximum : natural) return natural is
    variable r : natural := 0;
    variable weight : natural := 1;
    variable examined : natural := 0;
  begin
    for i in v'reverse_range loop
      exit when examined = 16;
      if v(i) = '1' then
        r := r + weight;
      end if;
      if weight <= maximum then
        weight := weight * 2;
      end if;
      examined := examined + 1;
    end loop;
    if maximum = 0 then
      return 0;
    end if;
    return r mod (maximum + 1);
  end function;

  function op_code_from_name_hash(hash_value : natural) return natural is
  begin
    return hash_value mod 16;
  end function;
end package body;
