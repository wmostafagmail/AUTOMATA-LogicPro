# GHDL Verification Policy

## Default Profile

The default lab profile is `VHDL-2008 strict GHDL gates`.

Required gates:

- Analyze generated RTL.
- Elaborate generated design/testbench.
- Run synthesis when applicable.
- Run self-checking simulation.
- Require a configured pass marker when a testbench is present.

## Static Rejections Before GHDL

The lab rejects obvious low-quality output before invoking GHDL:

- `std_logic_unsigned`
- `std_logic_arith`
- `std_logic_signed`
- placeholders such as `TODO` or `implementation omitted`
- Markdown/HTML mixed into VHDL
- RTL file I/O constructs

## Tool Path

Set `VHDL_LAB_GHDL_PATH` if GHDL is not located at `/opt/homebrew/bin/ghdl`.
