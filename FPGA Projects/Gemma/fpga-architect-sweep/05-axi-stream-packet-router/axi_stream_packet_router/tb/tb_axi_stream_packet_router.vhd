library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use std.env.all;

library work;
use work.router_pkg.all;

entity tb_axi_stream_packet_router is
end entity tb_axi_stream_packet_router;

architecture sim of tb_axi_stream_packet_router is

    constant NUM_PORTS : integer := 4;
    signal clk   : std_logic := '0';
    signal reset : std_logic := '1';
    
    -- Signals to connect to DUT
    signal s_tdata  : axi_stream_array(0 to NUM_PORTS-1);
    signal s_tready : axi_stream_array(0 to NUM_PORTS-1);
    signal m_tdata  : axi_stream_array(0 to NUM_PORTS-1);
    signal m_tvalid : axi_stream_array(0 to NUM_PORTS-1);
    signal m_tready : axi_stream_array(0 to NUM_PORTS-1);

    signal test_failed : boolean := false;

    -- Helper procedure for sending a packet. 
    -- Local variable v_rec is declared strictly within the subprogram scope.
    procedure send_packet (
        constant src_id     : in integer;
        constant dst_id     : in integer;
        constant data_val   : in t_data;
        signal   p_tdata    : inout axi_stream_array;
        signal   p_tready   : in axi_stream_array;
        signal   p_clk      : in std_logic
    ) is
        variable v_rec : axi_stream_rec;
    begin
        -- Send Header (Destination ID as the data field for simple routing logic)
        v_rec := p_tdata(src_id);
        v_rec.tdata   := std_logic_vector(to_unsigned(dst_id, DATA_WIDTH));
        v_rec.tvalid  := '1';
        v_rec.tlast   := '0';
        p_tdata(src_id) <= v_rec;

        -- Wait for handshake (Ready and Clock edge)
        loop
            wait until rising_edge(p_clk);
            exit when p_tready(src_id).tready = '1';
        end loop;
        
        -- Send Data Body
        v_rec := p_tdata(src_id);
        v_rec.tdata   := data_val;
        v_rec.tlast   := '1';
        p_tdata(src_id) <= v_rec;

        loop
            wait until rising_edge(p_clk);
            exit when p_tready(src_id).tready = '1';
        end loop;
        
        -- Clean up (Deassert Valid)
        v_rec := p_tdata(src_id);
        v_rec.tvalid := '0';
        p_tdata(src_id) <= v_rec;
    end procedure;

begin

    -- Clock generation: 100MHz (10ns period)
    clk <= not clk after 5 ns;

    dut : entity work.axi_stream_packet_router
        generic map ( NUM_PORTS => NUM_PORTS )
        port map (
            clk             => clk,
            reset           => reset,
            s_axis_tdata    => s_tdata,
            s_axis_tready   => s_tready,
            m_axis_tdata    => m_tdata,
            m_axis_tvalid   => m_tvalid,
            m_axis_tready   => m_tready
        );

    -- Main Simulation Process
    process
    begin
        -- Initialize interfaces to known state
        for i in 0 to NUM_PORTS-1 loop
            s_tdata(i).tvalid <= '0';
            m_tready(i).tready <= '1'; -- Sinks are always ready for this basic test
        end loop;

        -- Reset Sequence
        reset <= '1';
        wait for 50 ns;
        reset <= '0';
        wait until rising_edge(clk);
        wait for 20 ns;

        -- Test Case 1: Simple routing (Port 0 -> Port 2)
        report "Running Test 1: Basic Routing...";
        send_packet(0, 2, x"DEADBEEF", s_tdata, s_tready, clk);
        wait for 40 ns;

        -- Test Case 2: Parallel routing (Port 1 -> Port 3 and Port 0 -> Port 1)
        report "Running Test 2: Parallel Routing...";
        send_packet(1, 3, x"CAFEBABE", s_tdata, s_tready, clk);
        send_packet(0, 1, x"12345678", s_tdata, s_tready, clk);
        wait for 50 ns;

        -- Test Case 3: Contention (Port 0 -> Port 2 and Port 1 -> Port 2)
        report "Running Test 3: Contention...";
        send_packet(0, 2, x"AAAAAAAA", s_tdata, s_tready, clk);
        send_packet(1, 2, x"BBBBBBBB", s_tdata, s_tready, clk);
        wait for 100 ns;

        report "All tests completed. Checking results...";
        if not test_failed then
            report "TEST PASSED";
            std.env.stop(0);
        else
            report "TEST FAILED";
            std.env.stop(1);
        end if;
    end process;

end architecture sim;
