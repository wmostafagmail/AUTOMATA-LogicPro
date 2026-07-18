library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use work.uart_spi_bridge_pkg.all;

entity rx_fifo is
  generic (
    DEPTH : integer := 16
  );
  port (
    clk_i   : in  std_logic;
    rst_i   : in  std_logic;
    wr_en_i : in  std_logic;
    rd_en_i : in  std_logic;
    data_i  : in byte_t;
    q_o     : out byte_t;
    empty_o : out std_logic;
    full_o  : out std_logic
  );
end entity;

architecture rtl of rx_fifo is
  type mem_t is array(0 to DEPTH - 1) of byte_t;
  signal mem : mem_t := (others => (others => '0'));
  signal wr_ptr : integer range 0 to DEPTH := 0;
  signal rd_ptr : integer range 0 to DEPTH := 0;
  signal cnt : integer range 0 to DEPTH := 0;
begin
  process(clk_i)
  begin
    if rising_edge(clk_i) then
      if rst_i = '1' then
        wr_ptr <= 0; rd_ptr <= 0; cnt <= 0;
      else
        if wr_en_i = '1' and cnt < DEPTH then
          mem(wr_ptr) <= data_i;
          wr_ptr <= wr_ptr + 1;
          if wr_ptr = DEPTH - 1 then wr_ptr <= 0; end if;
          cnt <= cnt + 1;
        end if;
        if rd_en_i = '1' and cnt > 0 then
          cnt <= cnt - 1;
          rd_ptr <= rd_ptr + 1;
          if rd_ptr = DEPTH - 1 then rd_ptr <= 0; end if;
        end if;
      end if;
    end if;
  end process;
  q_o <= mem(rd_ptr);
  empty_o <= '1' when cnt = 0 else '0';
  full_o  <= '1' when cnt = DEPTH else '0';
end architecture;