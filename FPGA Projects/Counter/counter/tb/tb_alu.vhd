library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity tb_alu is
end entity tb_alu;

architecture sim of tb_alu is
  constant CLK_PERIOD : time := 10 ns;
  signal clk, rst : std_logic;
  signal a, b     : std_logic_vector(7 downto 0);
  signal op       : std_logic_vector(2 downto 0);
  signal result   : std_logic_vector(7 downto 0);
  signal overflow : std_logic;
  signal zero     : std_logic;

  component alu
    generic (
      DATA_WIDTH : integer := 8
    );
    port (
      clk      : in  std_logic;
      rst      : in  std_logic;
      a        : in  std_logic_vector(7 downto 0);
      b        : in  std_logic_vector(7 downto 0);
      op       : in  std_logic_vector(2 downto 0);
      result   : out std_logic_vector(7 downto 0);
      overflow : out std_logic;
      zero     : out std_logic
    );
  end component;
begin
  dut : alu
    generic map (DATA_WIDTH => 8)
    port map (clk => clk, rst => rst, a => a, b => b, op => op, result => result, overflow => overflow, zero => zero);

  clk_gen : process
  begin
    clk <= '0';
    wait for CLK_PERIOD/2;
    clk <= '1';
    wait for CLK_PERIOD/2;
  end process;

  rst_gen : process
  begin
    rst <= '1';
    wait for 20 ns;
    rst <= '0';
    wait;
  end process;

  stim_proc : process
    variable pass : boolean := true;
  begin
    wait until rising_edge(clk);
    wait until rst = '0';
    wait for 10 ns;

    -- Test ADD
    a <= "00000001"; b <= "00000001"; op <= "000";
    wait until rising_edge(clk); wait for 1 ns;
    if result /= "00000010" then pass := false; end if;

    -- Test SUB
    a <= "00000010"; b <= "00000001"; op <= "001";
    wait until rising_edge(clk); wait for 1 ns;
    if result /= "00000001" then pass := false; end if;

    -- Test AND
    a <= "11110000"; b <= "00001111"; op <= "010";
    wait until rising_edge(clk); wait for 1 ns;
    if result /= "00000000" then pass := false; end if;

    -- Test OR
    a <= "00001111"; b <= "11110000"; op <= "011";
    wait until rising_edge(clk); wait for 1 ns;
    if result /= "11111111" then pass := false; end if;

    -- Test NOT
    a <= "10101010"; b <= "00000000"; op <= "101";
    wait until rising_edge(clk); wait for 1 ns;
    if result /= "01010101" then pass := false; end if;

    -- Test SHL
    a <= "00000001"; b <= "00000000"; op <= "110";
    wait until rising_edge(clk); wait for 1 ns;
    if result /= "00000010" then pass := false; end if;

    -- Test SHR
    a <= "00001000"; b <= "00000000"; op <= "111";
    wait until rising_edge(clk); wait for 1 ns;
    if result /= "00000100" then pass := false; end if;

    if pass then
      std.env.stop(0);
    else
      std.env.stop(1);
    end if;
  end process;
end architecture sim;