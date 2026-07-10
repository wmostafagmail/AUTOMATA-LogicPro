library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity fifo_generic is
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
end entity fifo_generic;

architecture rtl of fifo_generic is
    subtype addr_t is integer range 0 to DEPTH - 1;

    type mem_t is array (addr_t) of std_logic_vector(WIDTH - 1 downto 0);

    constant ADDR_WIDTH : natural := 3;

    signal wr_ptr_s : unsigned(ADDR_WIDTH - 1 downto 0) := (others => '0');
    signal rd_ptr_s : unsigned(ADDR_WIDTH - 1 downto 0) := (others => '0');
    signal cnt_s    : integer range 0 to DEPTH := 0;

    variable ram_v : mem_t := (others => (others => '0'));

begin

    process(clk_i)
        variable idx_wr_v : addr_t;
        variable idx_rd_v : addr_t;
        variable dout_v   : std_logic_vector(WIDTH - 1 downto 0);
    begin
        if rising_edge(clk_i) then
            if rst_i = '1' then
                wr_ptr_s <= (others => '0');
                rd_ptr_s <= (others => '0');
                cnt_s    <= 0;
                dout_v   := (others => '0');
                ram_v    := (others => (others => '0'));
            else
                dout_v := (others => '0');

                if wr_en_i = '1' and rd_en_i = '1' then
                    idx_rd_v := to_integer(rd_ptr_s);
                    dout_v   := ram_v(idx_rd_v);
                    rd_ptr_s <= rd_ptr_s + 1;
                    cnt_s    <= cnt_s - 1;

                    if cnt_s > 0 then
                        idx_wr_v := to_integer(wr_ptr_s);
                        ram_v(idx_wr_v) := din_i;
                        wr_ptr_s <= wr_ptr_s + 1;
                        cnt_s    <= cnt_s + 1;
                    end if;
                elsif rd_en_i = '1' and cnt_s > 0 then
                    idx_rd_v := to_integer(rd_ptr_s);
                    dout_v   := ram_v(idx_rd_v);
                    rd_ptr_s <= rd_ptr_s + 1;
                    cnt_s    <= cnt_s - 1;
                elsif wr_en_i = '1' and cnt_s < DEPTH then
                    idx_wr_v := to_integer(wr_ptr_s);
                    ram_v(idx_wr_v) := din_i;
                    wr_ptr_s <= wr_ptr_s + 1;
                    cnt_s    <= cnt_s + 1;
                end if;

                dout_o <= dout_v;
            end if;
        end if;
    end process;

    full_o  <= '1' when cnt_s = DEPTH else '0';
    empty_o <= '1' when cnt_s = 0     else '0';

end architecture rtl;