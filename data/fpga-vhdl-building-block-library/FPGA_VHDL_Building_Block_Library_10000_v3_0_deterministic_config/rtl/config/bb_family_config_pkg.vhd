library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use work.bb_config_pkg.all;

package bb_family_config_pkg is
  type t_arithmetic_config is record
    data_width      : positive;
    signed_mode     : boolean;
    pipeline_stages : natural;
    overflow_mode   : t_overflow_mode;
    rounding_mode   : t_rounding_mode;
    implementation  : t_implementation_mode;
  end record;

  constant C_ARITHMETIC_DEFAULT : t_arithmetic_config := (
    data_width => 32, signed_mode => false, pipeline_stages => 1,
    overflow_mode => OVERFLOW_WRAP, rounding_mode => ROUND_TRUNCATE,
    implementation => IMPLEMENTATION_AUTO);

  type t_fifo_config is record
    data_width          : positive;
    depth               : positive;
    almost_full_level   : natural;
    almost_empty_level  : natural;
    first_word_fallthrough : boolean;
    output_register     : boolean;
    synchronizer_stages : positive;
    implementation      : t_implementation_mode;
  end record;

  constant C_FIFO_DEFAULT : t_fifo_config := (
    data_width => 32, depth => 16, almost_full_level => 14,
    almost_empty_level => 2, first_word_fallthrough => false,
    output_register => true, synchronizer_stages => 2,
    implementation => IMPLEMENTATION_AUTO);

  type t_stream_config is record
    data_width      : positive;
    pipeline_stages : natural;
    has_last        : boolean;
    has_keep        : boolean;
    interface_mode  : t_interface_mode;
  end record;

  constant C_STREAM_DEFAULT : t_stream_config := (
    data_width => 32, pipeline_stages => 1,
    has_last => false, has_keep => false, interface_mode => IF_READY_VALID);

  function is_valid(cfg : t_arithmetic_config) return boolean;
  function is_valid(cfg : t_fifo_config) return boolean;
  function is_valid(cfg : t_stream_config) return boolean;
  function arithmetic_latency(cfg : t_arithmetic_config) return natural;
  function fifo_latency(cfg : t_fifo_config) return natural;
  function stream_latency(cfg : t_stream_config) return natural;
end package;

package body bb_family_config_pkg is
  function is_valid(cfg : t_arithmetic_config) return boolean is
  begin
    return cfg.data_width >= 1 and cfg.pipeline_stages <= 64;
  end function;

  function is_valid(cfg : t_fifo_config) return boolean is
  begin
    return cfg.data_width >= 1 and cfg.depth >= 2 and
           cfg.almost_full_level < cfg.depth and
           cfg.almost_empty_level < cfg.depth and
           cfg.synchronizer_stages >= 2;
  end function;

  function is_valid(cfg : t_stream_config) return boolean is
  begin
    return cfg.data_width >= 1 and cfg.pipeline_stages <= 64;
  end function;

  function arithmetic_latency(cfg : t_arithmetic_config) return natural is
  begin
    return cfg.pipeline_stages;
  end function;

  function fifo_latency(cfg : t_fifo_config) return natural is
  begin
    if cfg.first_word_fallthrough and not cfg.output_register then return 0; end if;
    if cfg.output_register then return 1; end if;
    return 0;
  end function;

  function stream_latency(cfg : t_stream_config) return natural is
  begin
    return cfg.pipeline_stages;
  end function;
end package body;
