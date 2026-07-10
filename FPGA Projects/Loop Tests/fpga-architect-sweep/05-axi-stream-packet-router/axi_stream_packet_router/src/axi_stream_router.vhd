library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity axi_stream_router is
  generic (
    DATA_WIDTH : integer := 32
  );
  port (
    clk_i            : in  std_logic;
    rst_i            : in  std_logic;
    
    s_axis_in0_valid_i : in  std_logic;
    s_axis_in0_ready_o : out std_logic;
    s_axis_in0_data_i  : in  std_logic_vector(DATA_WIDTH-1 downto 0);
    
    s_axis_in1_valid_i : in  std_logic;
    s_axis_in1_ready_o : out std_logic;
    s_axis_in1_data_i  : in  std_logic_vector(DATA_WIDTH-1 downto 0);
    
    dest_sel_i         : in  std_logic;
    
    m_axis_out_valid_o : out std_logic;
    m_axis_out_ready_i : in  std_logic;
    m_axis_out_data_o  : out std_logic_vector(DATA_WIDTH-1 downto 0)
  );
end entity axi_stream_router;

architecture rtl of axi_stream_router is
  signal int_valid_s     : std_logic;
  signal int_data_s      : std_logic_vector(DATA_WIDTH-1 downto 0);
  signal int_ready_s     : std_logic;
begin
  -- Internal routing logic
  int_valid_s <= s_axis_in0_valid_i when dest_sel_i = '0' else s_axis_in1_valid_i;
  int_data_s  <= s_axis_in0_data_i when dest_sel_i = '0' else s_axis_in1_data_i;
  int_ready_s <= m_axis_out_ready_i;

  -- Backpressure handling: only allow input to drive when ready
  s_axis_in0_ready_o <= int_ready_s when dest_sel_i = '0' else '0';
  s_axis_in1_ready_o <= int_ready_s when dest_sel_i = '1' else '0';

  -- Output driving
  m_axis_out_valid_o <= int_valid_s;
  m_axis_out_data_o  <= int_data_s;

end architecture rtl;
