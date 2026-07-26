library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use work.bb_util_pkg.all;

entity bb_sync_fifo_core is
  generic (
    DATA_WIDTH : positive := 32;
    DEPTH      : positive := 16
  );
  port (
    clk          : in  std_logic;
    rst_n        : in  std_logic;
    wr_en        : in  std_logic;
    wr_data      : in  std_logic_vector(DATA_WIDTH-1 downto 0);
    full         : out std_logic;
    almost_full  : out std_logic;
    rd_en        : in  std_logic;
    rd_data      : out std_logic_vector(DATA_WIDTH-1 downto 0);
    empty        : out std_logic;
    almost_empty : out std_logic;
    level        : out std_logic_vector(clog2(DEPTH+1)-1 downto 0)
  );
end entity;

architecture rtl of bb_sync_fifo_core is
  type mem_t is array (0 to DEPTH-1) of std_logic_vector(DATA_WIDTH-1 downto 0);
  signal mem : mem_t := (others => (others => '0'));
  signal wr_ptr : natural range 0 to DEPTH-1 := 0;
  signal rd_ptr : natural range 0 to DEPTH-1 := 0;
  signal count  : natural range 0 to DEPTH := 0;
  signal rd_reg : std_logic_vector(DATA_WIDTH-1 downto 0) := (others => '0');
begin
  full <= '1' when count = DEPTH else '0';
  empty <= '1' when count = 0 else '0';
  almost_full <= '1' when count >= DEPTH-1 else '0';
  almost_empty <= '1' when count <= 1 else '0';
  level <= std_logic_vector(to_unsigned(count, level'length));
  rd_data <= rd_reg;

  process(clk)
    variable do_write, do_read : boolean;
  begin
    if rising_edge(clk) then
      if rst_n = '0' then
        wr_ptr <= 0;
        rd_ptr <= 0;
        count <= 0;
        rd_reg <= (others => '0');
      else
        do_write := (wr_en = '1') and (count < DEPTH);
        do_read := (rd_en = '1') and (count > 0);
        if do_write then
          mem(wr_ptr) <= wr_data;
          if wr_ptr = DEPTH-1 then wr_ptr <= 0; else wr_ptr <= wr_ptr + 1; end if;
        end if;
        if do_read then
          rd_reg <= mem(rd_ptr);
          if rd_ptr = DEPTH-1 then rd_ptr <= 0; else rd_ptr <= rd_ptr + 1; end if;
        end if;
        if do_write and not do_read then
          count <= count + 1;
        elsif do_read and not do_write then
          count <= count - 1;
        end if;
      end if;
    end if;
  end process;
end architecture;
