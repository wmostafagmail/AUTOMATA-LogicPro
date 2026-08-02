library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity axi_stream_packet_router_top is
  generic (
    DATA_WIDTH : positive := 8
  );
  port (
    clk : in std_logic;
    rst : in std_logic;
    s_axis_tvalid_i : in std_logic;
    s_axis_tready_o : out std_logic;
    s_axis_tdata_i : in std_logic_vector(31 downto 0);
    s_axis_tlast_i : in std_logic;
    m_axis_tvalid_o : out std_logic;
    m_axis_tready_i : in std_logic;
    m_axis_tdata_o : out std_logic_vector(31 downto 0);
    m_axis_tlast_o : out std_logic
  );
end entity axi_stream_packet_router_top;

library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

architecture rtl of axi_stream_packet_router_top is
    signal s_axis_tready_reg : std_logic := '0';
    signal m_axis_tvalid_reg : std_logic := '0';
    signal m_axis_tdata_reg : std_logic_vector(31 downto 0) := (others => '0');
    signal m_axis_tlast_reg : std_logic := '0';
begin
    s_axis_tready_o <= s_axis_tready_reg;

    process(clk, rst)
    begin
        if rst = '1' then
            s_axis_tready_reg <= '0';
            m_axis_tvalid_reg <= '0';
            m_axis_tdata_reg <= (others => '0');
            m_axis_tlast_reg <= '0';
        elsif rising_edge(clk) then
            s_axis_tready_reg <= m_axis_tready_i;
            m_axis_tvalid_reg <= s_axis_tvalid_i;
            m_axis_tdata_reg <= s_axis_tdata_i;
            m_axis_tlast_reg <= s_axis_tlast_i;
        end if;
    end process;

    m_axis_tvalid_o <= m_axis_tvalid_reg;
    m_axis_tdata_o <= m_axis_tdata_reg;
    m_axis_tlast_o <= m_axis_tlast_reg;
end architecture rtl;
