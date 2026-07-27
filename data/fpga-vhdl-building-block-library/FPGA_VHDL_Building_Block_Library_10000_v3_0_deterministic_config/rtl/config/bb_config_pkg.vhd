library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

package bb_config_pkg is
  constant C_CONFIG_SCHEMA_VERSION : natural := 1;

  type t_overflow_mode is (OVERFLOW_WRAP, OVERFLOW_SATURATE, OVERFLOW_FLAG, OVERFLOW_ERROR);
  type t_rounding_mode is (ROUND_TRUNCATE, ROUND_NEAREST, ROUND_NEAREST_EVEN,
                           ROUND_TOWARD_ZERO, ROUND_TOWARD_POSITIVE, ROUND_TOWARD_NEGATIVE);
  type t_reset_mode is (RESET_SYNC_ACTIVE_HIGH, RESET_SYNC_ACTIVE_LOW,
                        RESET_ASYNC_ACTIVE_HIGH, RESET_ASYNC_ACTIVE_LOW);
  type t_interface_mode is (IF_NATIVE, IF_READY_VALID, IF_AXI_STREAM, IF_AXI4_LITE,
                            IF_APB, IF_WISHBONE, IF_AVALON);
  type t_implementation_mode is (IMPLEMENTATION_AUTO, IMPLEMENTATION_LUT,
                                 IMPLEMENTATION_DSP, IMPLEMENTATION_REGISTERS,
                                 IMPLEMENTATION_DISTRIBUTED_RAM,
                                 IMPLEMENTATION_BLOCK_RAM,
                                 IMPLEMENTATION_ULTRA_RAM,
                                 IMPLEMENTATION_VENDOR_PRIMITIVE);
  type t_latency_kind is (LATENCY_COMBINATIONAL, LATENCY_FIXED, LATENCY_VARIABLE);

  function clog2(value : positive) return natural;
  function is_power_of_two(value : positive) return boolean;
  function next_power_of_two(value : positive) return positive;
  function required_counter_width(maximum : natural) return positive;
  function min_nat(a, b : natural) return natural;
  function max_nat(a, b : natural) return natural;
  function bool_to_nat(value : boolean) return natural;
end package;

package body bb_config_pkg is
  function clog2(value : positive) return natural is
    variable v : natural := value - 1;
    variable r : natural := 0;
  begin
    while v > 0 loop
      v := v / 2;
      r := r + 1;
    end loop;
    return r;
  end function;

  function is_power_of_two(value : positive) return boolean is
    variable v : positive := value;
  begin
    while (v mod 2) = 0 and v > 1 loop
      v := v / 2;
    end loop;
    return v = 1;
  end function;

  function next_power_of_two(value : positive) return positive is
    variable r : positive := 1;
  begin
    while r < value loop
      r := r * 2;
    end loop;
    return r;
  end function;

  function required_counter_width(maximum : natural) return positive is
  begin
    if maximum = 0 then
      return 1;
    end if;
    return positive(clog2(maximum + 1));
  end function;

  function min_nat(a, b : natural) return natural is
  begin
    if a < b then return a; else return b; end if;
  end function;

  function max_nat(a, b : natural) return natural is
  begin
    if a > b then return a; else return b; end if;
  end function;

  function bool_to_nat(value : boolean) return natural is
  begin
    if value then return 1; else return 0; end if;
  end function;
end package body;
