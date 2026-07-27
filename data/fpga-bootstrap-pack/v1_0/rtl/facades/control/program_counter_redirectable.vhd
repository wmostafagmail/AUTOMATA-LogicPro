library ieee; use ieee.std_logic_1164.all;
entity program_counter_redirectable is generic(G_PC_WIDTH:positive:=32;G_RESET_VECTOR:natural:=0;G_INSTR_BYTES:positive:=4); port(clk_i,rst_ni,redirect_valid_i:in std_logic; redirect_pc_i:in std_logic_vector(G_PC_WIDTH-1 downto 0); pc_o,pc_next_o:out std_logic_vector(G_PC_WIDTH-1 downto 0); valid_o:out std_logic); end entity;
architecture rtl of program_counter_redirectable is begin
  u_core:entity work.program_counter generic map(PC_WIDTH=>G_PC_WIDTH,RESET_VECTOR=>G_RESET_VECTOR,INSTR_BYTES=>G_INSTR_BYTES)
  port map(clk=>clk_i,rst_n=>rst_ni,stall=>'0',sequential_advance=>'1',redirect_valid=>redirect_valid_i,redirect_pc=>redirect_pc_i,pc_current=>pc_o,pc_next=>pc_next_o,pc_valid=>valid_o);
end architecture;
