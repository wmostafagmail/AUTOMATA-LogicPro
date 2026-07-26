library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity bb_bus_adapter_core is
  generic (
    ADDR_WIDTH : positive := 32;
    DATA_WIDTH : positive := 32
  );
  port (
    clk       : in  std_logic;
    rst_n     : in  std_logic;
    req_valid : in  std_logic;
    req_ready : out std_logic;
    req_write : in  std_logic;
    req_addr  : in  std_logic_vector(ADDR_WIDTH-1 downto 0);
    req_wdata : in  std_logic_vector(DATA_WIDTH-1 downto 0);
    rsp_valid : out std_logic;
    rsp_ready : in  std_logic;
    rsp_rdata : out std_logic_vector(DATA_WIDTH-1 downto 0);
    rsp_error : out std_logic
  );
end entity;

architecture rtl of bb_bus_adapter_core is
  signal valid_reg : std_logic := '0';
  signal data_reg  : std_logic_vector(DATA_WIDTH-1 downto 0) := (others => '0');
begin
  req_ready <= (not valid_reg) or rsp_ready;
  rsp_valid <= valid_reg;
  rsp_rdata <= data_reg;
  rsp_error <= '0';

  process(clk)
    variable addr_resized : unsigned(DATA_WIDTH-1 downto 0);
  begin
    if rising_edge(clk) then
      if rst_n = '0' then
        valid_reg <= '0';
        data_reg  <= (others => '0');
      elsif ((not valid_reg) or rsp_ready) = '1' then
        valid_reg <= req_valid;
        if req_valid = '1' then
          addr_resized := resize(unsigned(req_addr), DATA_WIDTH);
          if req_write = '1' then
            data_reg <= req_wdata;
          else
            data_reg <= std_logic_vector(addr_resized);
          end if;
        end if;
      end if;
    end if;
  end process;
end architecture;
