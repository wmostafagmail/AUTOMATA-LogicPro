library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use work.axi_stream_router_pkg.all;

entity axi_stream_packet_router is
  generic (
    G_DATA_WIDTH : natural := C_DATA_WIDTH
  );
  port (
    clk_i       : in  std_logic;
    rst_ni      : in  std_logic;
    -- Ingress ports
    in_valid_i  : in  std_logic_vector(C_NUM_IN - 1 downto 0);
    in_ready_o  : out std_logic_vector(C_NUM_IN - 1 downto 0);
    in_data_i   : in  std_logic_vector((C_NUM_IN * G_DATA_WIDTH) - 1 downto 0);
    in_last_i   : in  std_logic_vector(C_NUM_IN - 1 downto 0);
    -- Egress ports
    out_valid_o : out std_logic_vector(C_NUM_OUT - 1 downto 0);
    out_ready_i : in  std_logic_vector(C_NUM_OUT - 1 downto 0);
    out_data_o  : out std_logic_vector((C_NUM_OUT * G_DATA_WIDTH) - 1 downto 0);
    out_last_o  : out std_logic_vector(C_NUM_OUT - 1 downto 0)
  );
end entity axi_stream_packet_router;

architecture rtl of axi_stream_packet_router is

  subtype data_word_t is std_logic_vector(G_DATA_WIDTH - 1 downto 0);

  type ingress_data_array_t is array(0 to C_NUM_IN - 1) of data_word_t;
  type egress_data_array_t  is array(0 to C_NUM_OUT - 1) of data_word_t;

  signal ingress_valid : std_logic_vector(C_NUM_IN - 1 downto 0) := (others => '0');
  signal ingress_last  : std_logic_vector(C_NUM_IN - 1 downto 0) := (others => '0');
  signal ingress_data  : ingress_data_array_t;

  signal egress_valid  : std_logic_vector(C_NUM_OUT - 1 downto 0) := (others => '0');
  signal egress_last   : std_logic_vector(C_NUM_OUT - 1 downto 0) := (others => '0');
  signal egress_data   : egress_data_array_t;

  signal arb_request   : std_logic_vector(C_NUM_IN - 1 downto 0);
  signal arb_grant     : std_logic_vector(C_NUM_IN - 1 downto 0);
  signal arb_index     : integer range 0 to C_NUM_IN - 1;

begin

  -- Ingress data demux: split wide in_data into per-port words.
  gen_ingress_split : for k in 0 to C_NUM_IN - 1 generate
    ingress_valid(k) <= in_valid_i(k);
    ingress_last(k)  <= in_last_i(k);
    ingress_data(k)  <= in_data_i((k + 1) * G_DATA_WIDTH - 1 downto k * G_DATA_WIDTH);
  end generate gen_ingress_split;

  -- Arbiter request driven by egress valid signals.
  arb_request <= egress_valid;

  -- Arbiter selects one input to forward per output when multiple inputs contend.
  u_arb : entity work.router_arbiter
    generic map (G_NUM_IN => C_NUM_IN)
    port map (
      clk_i         => clk_i,
      rst_ni        => rst_ni,
      request_i     => arb_request,
      grant_o       => arb_grant,
      grant_index_o => arb_index
    );

  -- Routing: for each egress, pick the granted input whose destination matches.
  gen_egress_route : for j in 0 to C_NUM_OUT - 1 generate
    process(clk_i)
      variable dest        : port_index_t;
      variable match_found : boolean;
    begin
      if rising_edge(clk_i) then
        if rst_ni = '0' then
          egress_valid(j) <= '0';
          egress_data(j)  <= (others => '0');
          egress_last(j)  <= '0';
        else
          match_found := false;
          for i in 0 to C_NUM_IN - 1 loop
            if arb_grant(i) = '1' and not match_found then
              dest := get_dest_port(ingress_data(i));
              if dest = j then
                egress_valid(j) <= ingress_valid(i);
                egress_data(j)  <= ingress_data(i);
                egress_last(j)  <= ingress_last(i);
                match_found     := true;
              end if;
            end if;
          end loop;

          if not match_found then
            egress_valid(j) <= '0';
            egress_data(j)  <= (others => '0');
            egress_last(j)  <= '0';
          end if;
        end if;
      end if;
    end process;
  end generate gen_egress_route;

  -- Backpressure: deassert ingress ready when no egress can accept the routed packet.
  gen_ingress_ready : for k in 0 to C_NUM_IN - 1 generate
    process(clk_i)
      variable dest_k : port_index_t;
    begin
      if rising_edge(clk_i) then
        if rst_ni = '0' then
          in_ready_o(k) <= '0';
        else
          if ingress_valid(k) = '1' then
            dest_k := get_dest_port(ingress_data(k));
            if out_ready_i(dest_k) = '1' then
              in_ready_o(k) <= '1';
            else
              in_ready_o(k) <= '0';
            end if;
          else
            in_ready_o(k) <= '0';
          end if;
        end if;
      end if;
    end process;
  end generate gen_ingress_ready;

  -- Egress output mux: combine per-egress data into wide out_data.
  gen_egress_merge : for j in 0 to C_NUM_OUT - 1 generate
    out_valid_o(j) <= egress_valid(j);
    out_last_o(j)  <= egress_last(j);
    out_data_o((j + 1) * G_DATA_WIDTH - 1 downto j * G_DATA_WIDTH) <= egress_data(j);
  end generate gen_egress_merge;

end architecture rtl;