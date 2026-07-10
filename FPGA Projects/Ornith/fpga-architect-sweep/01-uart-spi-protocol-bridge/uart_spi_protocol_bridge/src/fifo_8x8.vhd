library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity fifo_8x8 is
    generic (
        WIDTH : integer := 8;
        DEPTH : integer := 8
    );
    port (
        clk_i   : in  std_logic;
        rst_i   : in  std_logic;
        wr_en_i : in  std_logic;
        rd_en_i : in  std_logic;
        din_i   : in  std_logic_vector(WIDTH - 1 downto 0);
        dout_o  : out std_logic_vector(WIDTH - 1 downto 0);
        full_o  : out std_logic;
        empty_o : out std_logic
    );
end entity fifo_8x8;

architecture rtl of fifo_8x8 is

    subtype addr_t is integer range 0 to DEPTH - 1;

    type mem_t is array (addr_t) of std_logic_vector(WIDTH - 1 downto 0);

    constant ADDR_WIDTH : natural := integer'left(0) + 3; -- sufficient for depth up to 8

    signal wr_ptr : unsigned(ADDR_WIDTH - 1 downto 0) := (others => '0');
    signal rd_ptr : unsigned(ADDR_WIDTH - 1 downto 0) := (others => '0');
    signal cnt    : unsigned(ADDR_WIDTH downto 0)     := (others => '0');

    variable ram : mem_t := (others => (others => '0'));

begin

    process(clk_i)
        variable idx_wr : addr_t;
        variable idx_rd : addr_t;
        variable dout_v : std_logic_vector(WIDTH - 1 downto 0);
    begin
        if rising_edge(clk_i) then
            if rst_i = '1' then
                wr_ptr   <= (others => '0');
                rd_ptr   <= (others => '0');
                cnt      <= (others => '0');
                dout_v   := (others => '0');
                ram      := (others => (others => '0'));
            else
                -- Write path: only when not full
                if wr_en_i = '1' and cnt < to_unsigned(DEPTH, cnt'length) then
                    idx_wr := to_integer(wr_ptr);
                    ram(idx_wr) := din_i;
                    wr_ptr   <= wr_ptr + 1;
                    cnt      <= cnt + 1;
                end if;

                -- Read path: only when not empty
                if rd_en_i = '1' and cnt > to_unsigned(0, cnt'length) then
                    idx_rd := to_integer(rd_ptr);
                    dout_v := ram(idx_rd);
                    rd_ptr <= rd_ptr + 1;
                    cnt    <= cnt - 1;
                end if;

                dout_o <= dout_v;
            end if;
        end if;
    end process;

    full_o  <= '1' when cnt = to_unsigned(DEPTH, cnt'length) else '0';
    empty_o <= '1' when cnt = to_unsigned(0, cnt'length)     else '0';

end architecture rtl;
