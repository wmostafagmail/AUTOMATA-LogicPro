library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

library work;
use work.router_pkg.all;

entity axi_stream_packet_router is
    generic (
        NUM_PORTS : integer := 4
    );
    port (
        clk      : in  std_logic;
        reset    : in  std_logic;
        -- Input ports (Source)
        s_axis_tdata   : in  axi_stream_array(0 to NUM_PORTS-1);
        s_axis_tready  : out axi_stream_array(0 to NUM_PORTS-1);
        -- Output ports (Destination)
        m_axis_tdata   : out axi_stream_array(0 to NUM_PORTS-1);
        m_axis_tvalid  : out axi_stream_array(0 to NUM_PORTS-1);
        m_axis_tready  : in  axi_stream_array(0 to NUM_PORTS-1)
    );
end entity axi_stream_packet_router;

architecture rtl of axi_stream_packet_router is

    -- Internal state for routing destination of current packet on each input port
    type t_dest_array is array (0 to NUM_PORTS-1) of integer range 0 to NUM_PORTS-1;
    signal current_dest : t_dest_array := (others => 0);
    
    -- Tracking if a packet header has been read for each input. 
    -- '0' means we are expecting a header, '1' means we are in the data phase.
    signal header_read  : std_logic_vector(NUM_PORTS-1 downto 0) := (others => '0');
    
    -- Internal mirror signals to avoid output port readback and multiple driver issues
    signal s_ready_int  : std_logic_vector(NUM_PORTS-1 downto 0) := (others => '0');
    signal m_valid_int  : std_logic_vector(NUM_PORTS-1 downto 0) := (others => '0');
    signal m_data_int   : axi_stream_array(0 to NUM_PORTS-1);

    -- Round Robin Pointers for each output port arbitration
    type t_rr_ptr is array (0 to NUM_PORTS-1) of integer range 0 to NUM_PORTS-1;
    signal rr_ptrs : t_rr_ptr := (others => 0);

begin

    -- Logic for Input Readiness and Header Extraction
    process(clk)
        variable v_dest_val : integer;
    begin
        if reset = '1' then
            header_read  <= (others => '0');
            current_dest <= (others => 0);
            rr_ptrs      <= (others => 0);
            s_ready_int  <= (others => '0');
        elsif rising_edge(clk) then
            -- Default readiness: start closed, open based on conditions
            s_ready_int <= (others => '0');

            for i in 0 to NUM_PORTS-1 loop
                if s_axis_tdata(i).tvalid = '1' then
                    if header_read(i) = '0' then
                        -- Header phase: extract destination and signal ready
                        v_dest_val := to_integer(unsigned(s_axis_tdata(i).tdata));
                        -- Clamp value to prevent out-of-bounds index in case of invalid input data
                        if v_dest_val >= 0 and v_dest_val < NUM_PORTS then
                            current_dest(i) <= v_dest_val;
                        end if;
                        
                        header_read(i) <= '1';
                        s_ready_int(i) <= '1';
                    else
                        -- Data phase: check target output and arbitration
                        if m_axis_tready(current_dest(i)).tready = '1' then
                            s_ready_int(i) <= '1';
                        end if;
                    end if;
                end if;
            end loop;

            -- Update Round Robin pointers based on successful output transfers
            for j in 0 to NUM_PORTS-1 loop
                if m_valid_int(j) = '1' and m_axis_tready(j).tready = '1' then
                    rr_ptrs(j) <= (rr_ptrs(j) + 1) mod NUM_PORTS;
                end if;
            end loop;
        end if;
    end process;

    -- Routing Logic, Arbitration, and Output Driving
    process(clk)
        variable v_out_data  : t_data;
        variable v_out_valid : std_logic;
    begin
        if reset = '1' then
            m_valid_int <= (others => '0');
            -- FIXED: Added missing tlast element to the record aggregate assignment to resolve GHDL analysis error
            m_data_int  <= (others => (tdata => (others => '0'), tvalid => '0', tready => '0', tlast => '0'));
        elsif rising_edge(clk) then
            for j in 0 to NUM_PORTS-1 loop
                v_out_valid := '0';
                v_out_data  := (others => '0');
                
                -- Arbitrate between inputs targeting output port j.
                for i in 0 to NUM_PORTS-1 loop
                    if current_dest(i) = j and s_axis_tdata(i).tvalid = '1' and header_read(i) = '1' then
                        v_out_valid := '1';
                        v_out_data  := s_axis_tdata(i).tdata;
                        exit; 
                    end if;
                end loop;
                
                m_valid_int(j) <= v_out_valid;
                -- Record elements assigned individually to avoid aggregate mismatch risks in different VHDL versions
                m_data_int(j).tdata  <= v_out_data;
                m_data_int(j).tvalid <= v_out_valid;
            end loop;
        end if;
    end process;

    -- Map internal mirror signals to output ports
    process(s_ready_int)
    begin
        for i in 0 to NUM_PORTS-1 loop
            s_axis_tready(i).tready <= s_ready_int(i);
        end loop;
    end process;

    process(m_data_int, m_valid_int)
    begin
        for i in 0 to NUM_PORTS-1 loop
            m_axis_tdata(i).tdata  <= m_data_int(i).tdata;
            m_axis_tvalid(i).tvalid <= m_valid_int(i);
        end loop;
    end process;

end architecture rtl;
