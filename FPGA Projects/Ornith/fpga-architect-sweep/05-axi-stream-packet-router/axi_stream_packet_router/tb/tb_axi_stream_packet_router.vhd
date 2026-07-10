library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use std.env.all;

entity tb_axi_stream_packet_router is
end entity tb_axi_stream_packet_router;

architecture sim of tb_axi_stream_packet_router is

  constant C_CLK_PERIOD       : time         := 10 ns;
  constant C_DATA_WIDTH       : natural      := 32;
  constant C_NUM_IN           : natural      := 2;
  constant C_NUM_OUT          : natural      := 2;
  constant C_DEST_BITS        : natural      := 8;

  signal clk_i                : std_logic              := '0';
  signal rst_ni               : std_logic              := '0';

  signal in_valid_i           : std_logic_vector(C_NUM_IN - 1 downto 0)   := (others => '0');
  signal in_ready_o           : std_logic_vector(C_NUM_IN - 1 downto 0);
  signal in_data_i            : std_logic_vector((C_NUM_IN * C_DATA_WIDTH) - 1 downto 0) := (others => '0');
  signal in_last_i            : std_logic_vector(C_NUM_IN - 1 downto 0)   := (others => '0');

  signal out_valid_o          : std_logic_vector(C_NUM_OUT - 1 downto 0);
  signal out_ready_i          : std_logic_vector(C_NUM_OUT - 1 downto 0)   := (others => '1');
  signal out_data_o           : std_logic_vector((C_NUM_OUT * C_DATA_WIDTH) - 1 downto 0);
  signal out_last_o           : std_logic_vector(C_NUM_OUT - 1 downto 0);

  signal test_failed          : boolean := false;

  function encode_dest_port(beat_data : in std_logic_vector(C_DATA_WIDTH - 1 downto 0);
                            dest     : in integer) return std_logic_vector is
    variable local_res    : std_logic_vector(C_DATA_WIDTH - 1 downto 0);
    variable dest_u       : unsigned(C_DEST_BITS - 1 downto 0);
  begin
    local_res := beat_data;
    dest_u := to_unsigned(dest, C_DEST_BITS);
    for b in C_DEST_BITS - 1 downto 0 loop
      local_res(C_DATA_WIDTH - 1 - b) := std_logic(dest_u(b));
    end loop;
    return local_res;
  end function encode_dest_port;

  function decode_dest_port(beat_data : in std_logic_vector(C_DATA_WIDTH - 1 downto 0)) return integer is
    variable dest_int : unsigned(C_DEST_BITS - 1 downto 0);
  begin
    for b in C_DEST_BITS - 1 downto 0 loop
      dest_int(b) := beat_data(C_DATA_WIDTH - 1 - b);
    end loop;
    return to_integer(dest_int);
  end function decode_dest_port;

begin

  clk_i <= not clk_i after C_CLK_PERIOD / 2;

  u_dut : entity work.axi_stream_packet_router
    generic map (G_DATA_WIDTH => C_DATA_WIDTH)
    port map (
      clk_i       => clk_i,
      rst_ni      => rst_ni,
      in_valid_i  => in_valid_i,
      in_ready_o  => in_ready_o,
      in_data_i   => in_data_i,
      in_last_i   => in_last_i,
      out_valid_o => out_valid_o,
      out_ready_i => out_ready_i,
      out_data_o  => out_data_o,
      out_last_o  => out_last_o
    );

  tb_process : process
    variable beat_local     : std_logic_vector(C_DATA_WIDTH - 1 downto 0);
    variable in_data_local  : std_logic_vector((C_NUM_IN * C_DATA_WIDTH) - 1 downto 0);
    variable out_data_local : std_logic_vector((C_NUM_OUT * C_DATA_WIDTH) - 1 downto 0);
    variable dest_port      : integer;
    variable pass_count     : integer := 0;
    variable fail_count     : integer := 0;

  begin

    -- Reset phase.
    wait until rising_edge(clk_i);
    rst_ni <= '0';
    in_valid_i <= (others => '0');
    in_last_i  <= (others => '0');
    in_data_i  <= (others => '0');
    wait until rising_edge(clk_i);
    rst_ni <= '1';

    -- Test 1: packet from input 0 to output 0.
    beat_local := encode_dest_port((others => '0'), 0) & x"AB";
    in_data_local := (others => '0');
    in_data_local(C_DATA_WIDTH - 1 downto 0) := beat_local;
    in_data_i <= in_data_local;
    in_valid_i(0) <= '1';
    in_last_i(0)  <= '1';

    wait until rising_edge(clk_i);

    -- Post-edge observation.
    wait until rising_edge(clk_i);
    for i in out_data_local'range loop
      out_data_local(i) := out_data_o(i);
    end loop;

    if out_valid_o(0) = '1' and out_last_o(0) = '1' then
      dest_port := decode_dest_port(out_data_local(C_DATA_WIDTH - 1 downto 0));
      if dest_port = 0 then
        pass_count := pass_count + 1;
      else
        fail_count := fail_count + 1;
        test_failed <= true;
      end if;
    else
      fail_count := fail_count + 1;
      test_failed <= true;
    end if;

    in_valid_i(0) <= '0';
    in_last_i(0)  <= '0';
    wait until rising_edge(clk_i);

    -- Test 2: packet from input 1 to output 1.
    beat_local := encode_dest_port((others => '0'), 1) & x"CD";
    in_data_local := (others => '0');
    in_data_local((C_NUM_IN * C_DATA_WIDTH - 1) downto (C_NUM_IN - 1) * C_DATA_WIDTH) := beat_local;
    in_data_i <= in_data_local;
    in_valid_i(1) <= '1';
    in_last_i(1)  <= '1';

    wait until rising_edge(clk_i);

    wait until rising_edge(clk_i);
    for i in out_data_local'range loop
      out_data_local(i) := out_data_o(i);
    end loop;

    if out_valid_o(1) = '1' and out_last_o(1) = '1' then
      dest_port := decode_dest_port(out_data_local((C_NUM_OUT * C_DATA_WIDTH - 1) downto (C_NUM_OUT - 1) * C_DATA_WIDTH));
      if dest_port = 1 then
        pass_count := pass_count + 1;
      else
        fail_count := fail_count + 1;
        test_failed <= true;
      end if;
    else
      fail_count := fail_count + 1;
      test_failed <= true;
    end if;

    in_valid_i(1) <= '0';
    in_last_i(1)  <= '0';
    wait until rising_edge(clk_i);

    -- Test 3: contention - both inputs target output 0. Input 0 wins by priority.
    beat_local := encode_dest_port((others => '0'), 0) & x"EF";
    in_data_local := (others => '0');
    in_data_local(C_DATA_WIDTH - 1 downto 0) := beat_local;
    in_data_i <= in_data_local;
    in_valid_i(0) <= '1';
    in_last_i(0)  <= '1';

    beat_local := encode_dest_port((others => '0'), 0) & x"12";
    in_data_local := (others => '0');
    in_data_local((C_NUM_IN * C_DATA_WIDTH - 1) downto (C_NUM_IN - 1) * C_DATA_WIDTH) := beat_local;
    in_data_i <= in_data_local;
    in_valid_i(1) <= '1';
    in_last_i(1)  <= '1';

    wait until rising_edge(clk_i);

    -- Allow second beat to flow through.
    wait until rising_edge(clk_i);

    for i in out_data_local'range loop
      out_data_local(i) := out_data_o(i);
    end loop;

    if out_valid_o(0) = '1' then
      dest_port := decode_dest_port(out_data_local(C_DATA_WIDTH - 1 downto 0));
      if dest_port = 0 then
        pass_count := pass_count + 1;
      else
        fail_count := fail_count + 1;
        test_failed <= true;
      end if;
    else
      fail_count := fail_count + 1;
      test_failed <= true;
    end if;

    in_valid_i(0) <= '0';
    in_last_i(0)  <= '0';
    in_valid_i(1) <= '0';
    in_last_i(1)  <= '0';
    wait until rising_edge(clk_i);

    -- Terminate.
    if test_failed = false then
      report "Test passed" severity note;
      std.env.stop(0);
    else
      std.env.stop(1);
    end if;

  end process tb_process;

end architecture sim;
