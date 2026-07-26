library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use work.bb_util_pkg.all;

entity bb_async_fifo_core is
  generic (
    DATA_WIDTH : positive := 32;
    DEPTH      : positive := 16
  );
  port (
    wr_clk       : in  std_logic;
    wr_rst_n     : in  std_logic;
    wr_en        : in  std_logic;
    wr_data      : in  std_logic_vector(DATA_WIDTH-1 downto 0);
    full         : out std_logic;
    almost_full  : out std_logic;
    rd_clk       : in  std_logic;
    rd_rst_n     : in  std_logic;
    rd_en        : in  std_logic;
    rd_data      : out std_logic_vector(DATA_WIDTH-1 downto 0);
    empty        : out std_logic;
    almost_empty : out std_logic
  );
end entity;

architecture rtl of bb_async_fifo_core is
  constant ADDR_WIDTH : natural := clog2(DEPTH);
  subtype ptr_t is unsigned(ADDR_WIDTH downto 0);
  type mem_t is array (0 to DEPTH-1) of std_logic_vector(DATA_WIDTH-1 downto 0);
  signal mem : mem_t := (others => (others => '0'));
  signal wr_bin, wr_gray, rd_bin, rd_gray : ptr_t := (others => '0');
  signal rd_gray_w1, rd_gray_w2 : ptr_t := (others => '0');
  signal wr_gray_r1, wr_gray_r2 : ptr_t := (others => '0');
  signal full_reg, empty_reg : std_logic := '0';
  signal rd_reg : std_logic_vector(DATA_WIDTH-1 downto 0) := (others => '0');
  attribute async_reg : string;
  attribute async_reg of rd_gray_w1, rd_gray_w2, wr_gray_r1, wr_gray_r2 : signal is "true";

  function bin2gray(v : ptr_t) return ptr_t is
  begin
    return v xor shift_right(v, 1);
  end function;

  function full_compare(next_wr_gray, sync_rd_gray : ptr_t) return boolean is
    variable target : ptr_t := sync_rd_gray;
  begin
    target(target'high downto target'high-1) := not sync_rd_gray(sync_rd_gray'high downto sync_rd_gray'high-1);
    return next_wr_gray = target;
  end function;
begin
  assert DEPTH >= 4 and is_power_of_two(DEPTH)
    report "bb_async_fifo_core DEPTH must be a power of two and at least 4"
    severity failure;

  full <= full_reg;
  empty <= empty_reg;
  almost_full <= full_reg;
  almost_empty <= empty_reg;
  rd_data <= rd_reg;

  process(wr_clk)
    variable next_bin, next_gray : ptr_t;
  begin
    if rising_edge(wr_clk) then
      if wr_rst_n = '0' then
        wr_bin <= (others => '0');
        wr_gray <= (others => '0');
        rd_gray_w1 <= (others => '0');
        rd_gray_w2 <= (others => '0');
        full_reg <= '0';
      else
        rd_gray_w1 <= rd_gray;
        rd_gray_w2 <= rd_gray_w1;
        next_bin := wr_bin;
        if wr_en = '1' and full_reg = '0' then
          mem(to_integer(wr_bin(ADDR_WIDTH-1 downto 0))) <= wr_data;
          next_bin := wr_bin + 1;
        end if;
        next_gray := bin2gray(next_bin);
        wr_bin <= next_bin;
        wr_gray <= next_gray;
        if full_compare(next_gray, rd_gray_w2) then full_reg <= '1'; else full_reg <= '0'; end if;
      end if;
    end if;
  end process;

  process(rd_clk)
    variable next_bin, next_gray : ptr_t;
  begin
    if rising_edge(rd_clk) then
      if rd_rst_n = '0' then
        rd_bin <= (others => '0');
        rd_gray <= (others => '0');
        wr_gray_r1 <= (others => '0');
        wr_gray_r2 <= (others => '0');
        empty_reg <= '1';
        rd_reg <= (others => '0');
      else
        wr_gray_r1 <= wr_gray;
        wr_gray_r2 <= wr_gray_r1;
        next_bin := rd_bin;
        if rd_en = '1' and empty_reg = '0' then
          rd_reg <= mem(to_integer(rd_bin(ADDR_WIDTH-1 downto 0)));
          next_bin := rd_bin + 1;
        end if;
        next_gray := bin2gray(next_bin);
        rd_bin <= next_bin;
        rd_gray <= next_gray;
        if next_gray = wr_gray_r2 then empty_reg <= '1'; else empty_reg <= '0'; end if;
      end if;
    end if;
  end process;
end architecture;
