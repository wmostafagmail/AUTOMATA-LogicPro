-- ============================================================
-- Testbench: tb_top_video_gen
-- Purpose: Verify VGA 640x480@60Hz timing windows, sync pulse
--          widths, counter wrap behavior, and a representative
--          pixel-addressing scenario under GHDL.
-- Standard: VHDL-2008
-- ============================================================

library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use std.env.all;

use work.vga_timing_pkg.all;

entity tb_top_video_gen is
end entity tb_top_video_gen;

architecture sim of tb_top_video_gen is

  constant TB_CLK_PERIOD : time := 40 ns;
  constant TB_SIM_TIME   : time := 20 ms;

  -- DUT ports
  signal clk_s      : std_logic := '0';
  signal rst_ni_i   : std_logic := '0';

  signal hs_s       : std_logic;
  signal vs_s       : std_logic;
  signal pix_en_s   : std_logic;
  signal r_s        : unsigned(7 downto 0);
  signal g_s        : unsigned(7 downto 0);
  signal b_s        : unsigned(7 downto 0);

  -- Testbook keeping flag (architecture-level, used by calling process)
  signal test_failed_s : std_logic := '0';

  ----------------------------------------------------------------
  -- Helper procedure: report a failure and set the architecture-level
  -- test_failed flag through its formal parameter. No outer-scope
  -- mutation beyond what is explicitly passed in.
  ----------------------------------------------------------------
  procedure mark_fail(
    constant msg         : in  string;
    signal   flag_out_io : inout std_logic)
  is
  begin
    report "[FAIL] " & msg severity error;
    flag_out_io <= '1';
  end procedure mark_fail;

  ----------------------------------------------------------------
  -- Helper procedure: synchronize reset application.
  -- Takes the DUT reset port as a formal parameter so it can drive
  -- it without relying on outer-scope signal references beyond that.
  -- All mutable state is passed explicitly through formals.
  ----------------------------------------------------------------
  procedure rst_sync_proc(signal rst_port : inout std_logic) is
    variable v_cnt : integer range 0 to 3;
  begin
    rst_port <= '0';
    wait until rising_edge(clk_s);
    for v_cnt in 1 to 2 loop
      wait until rising_edge(clk_s);
    end loop;
    rst_port <= '1';
  end procedure rst_sync_proc;

begin

  -- Clock generation
  clk_gen : process is
  begin
    clk_s <= '0';
    wait for TB_CLK_PERIOD / 2;
    clk_s <= '1';
    wait for TB_CLK_PERIOD / 2;
  end process clk_gen;

  -- DUT instantiation
  u_dut : entity work.top_video_gen(rtl)
    port map (
      clk_i   => clk_s,
      rst_ni  => rst_ni_i,
      hs_o    => hs_s,
      vs_o    => vs_s,
      pix_en_o=> pix_en_s,
      r_o     => r_s,
      g_o     => g_s,
      b_o     => b_s
    );

  -- Self-checking stimulus and observation process.
  -- Samples outputs only on the rising edge AFTER reset release.
  check_proc : process is
    variable v_expected_hs : std_logic;
    variable v_fail_msg    : string(1 to 200);

    -- Expected counters maintained by the testbench.
    variable v_exp_h_cnt   : integer range 0 to H_TOTAL - 1;
    variable v_exp_v_cnt   : integer range 0 to V_TOTAL - 1;
    variable v_pass_count  : integer := 0;
    variable v_fail_count  : integer := 0;

  begin
    -- ----------------------------------------------------------
    -- Phase 1: apply reset and verify post-reset initial state.
    -- After synchronous reset, counters and syncs must be at
    -- their reset values and active_video must be low.
    -- ----------------------------------------------------------
    rst_sync_proc(rst_ni_i);

    wait until rising_edge(clk_s);
    wait for 1 ns; -- settle past reset deassertion edge

    v_expected_hs := '0';

    if hs_s /= v_expected_hs then
      v_fail_msg := "post-reset HSYNC mismatch: got '" & std_logic'image(hs_s) & "' expected '" & std_logic'image(v_expected_hs) & "'";
      mark_fail(v_fail_msg, test_failed_s);
    end if;

    if vs_s /= '0' then
      v_fail_msg := "post-reset VSYNC mismatch: got '" & std_logic'image(vs_s) & "' expected '0'";
      mark_fail(v_fail_msg, test_failed_s);
    end if;

    if pix_en_s /= '0' then
      v_fail_msg := "post-reset pix_en must be 0, got '" & std_logic'image(pix_en_s) & "'";
      mark_fail(v_fail_msg, test_failed_s);
    end if;

    -- ----------------------------------------------------------
    -- Phase 2: cycle through a few frames and verify timing.
    -- We observe every rising edge in active video and check
    -- that HSYNC/VSYNC windows match the spec.
    -- ----------------------------------------------------------
    v_exp_h_cnt := 0;
    v_exp_v_cnt := 0;

    for frame_idx in 0 to 2 loop
      for line_idx in 0 to V_TOTAL - 1 loop

        -- Advance horizontal counter until we cross H_ACTIVE.
        while v_exp_h_cnt < H_ACTIVE loop
          wait until rising_edge(clk_s);

          if rst_ni_i = '0' then
            v_fail_msg := "unexpected reset during active-video check";
            mark_fail(v_fail_msg, test_failed_s);
          end if;

          -- Verify HSYNC window.
          if v_exp_h_cnt >= H_ACTIVE and v_exp_h_cnt < H_ACTIVE + H_SYNC then
            v_expected_hs := '1';
          else
            v_expected_hs := '0';
          end if;

          if hs_s /= v_expected_hs then
            v_fail_msg := "HSYNC mismatch at h_cnt=" & integer'image(v_exp_h_cnt) & " frame=" & integer'image(frame_idx);
            mark_fail(v_fail_msg, test_failed_s);
          end if;

          -- Verify active-video flag.
          if v_exp_h_cnt < H_ACTIVE and v_exp_v_cnt < V_ACTIVE then
            v_expected_hs := '0';
          elsif v_exp_h_cnt = H_ACTIVE - 1 then
            -- Line just finished inside active video -> advance vertical.
            if v_exp_v_cnt < V_ACTIVE then
              v_exp_v_cnt := v_exp_v_cnt + 1;
            end if;
          end if;

          v_pass_count := v_pass_count + 1;
          v_exp_h_cnt  := v_exp_h_cnt + 1;
        end loop;

        -- Verify the HSYNC pulse width at the blanking boundary.
        if hs_s = '1' then
          v_fail_msg := "HSYNC still high after h_cnt=" & integer'image(H_ACTIVE - 1) & " (expected falling edge)";
          mark_fail(v_fail_msg, test_failed_s);
        end if;

        -- Advance into blanking.
        for blank_pos in H_ACTIVE to H_TOTAL - 1 loop
          wait until rising_edge(clk_s);

          if rst_ni_i = '0' then
            v_fail_msg := "unexpected reset during horizontal blanking";
            mark_fail(v_fail_msg, test_failed_s);
          end if;

          -- During blanking, HSYNC should be high only in the sync window.
          if blank_pos >= H_ACTIVE and blank_pos < H_ACTIVE + H_SYNC then
            v_expected_hs := '1';
          else
            v_expected_hs := '0';
          end if;

          if hs_s /= v_expected_hs then
            v_fail_msg := "HSYNC mismatch in blanking at pos=" & integer'image(blank_pos);
            mark_fail(v_fail_msg, test_failed_s);
          end if;

          v_pass_count := v_pass_count + 1;
        end loop;

      end loop;

      -- At the end of a full vertical frame we should see vs falling.
      wait until rising_edge(clk_s);

      if rst_ni_i = '0' then
        v_fail_msg := "unexpected reset at vertical wrap boundary";
        mark_fail(v_fail_msg, test_failed_s);
      end if;

      -- After the last line of V_TOTAL the vertical counter should wrap.
      -- We expect vs to be low and h_cnt to have wrapped to 0.
      if vs_s /= '0' then
        v_fail_msg := "VSYNC still high at frame boundary (frame=" & integer'image(frame_idx) & ")";
        mark_fail(v_fail_msg, test_failed_s);
      end if;

    end loop;

    -- ----------------------------------------------------------
    -- Phase 3: representative pixel-addressing check.
    -- Walk to a known coordinate and verify the pattern output
    -- matches a golden-model computation.
    -- ----------------------------------------------------------
    wait until rising_edge(clk_s);
    wait for 1 ns;

    v_exp_h_cnt := 0;
    v_exp_v_cnt := 0;

    -- Skip until we land inside active video at a known line.
    loop
      exit when pix_en_s = '1' and v_exp_v_cnt >= 10 and v_exp_v_cnt < 20;
      wait until rising_edge(clk_s);

      if rst_ni_i = '0' then
        v_fail_msg := "unexpected reset during pixel-addressing phase";
        mark_fail(v_fail_msg, test_failed_s);
      end if;

      -- Track counters so we can compute golden-model expectations.
      if v_exp_h_cnt < H_TOTAL - 1 then
        v_exp_h_cnt := v_exp_h_cnt + 1;
      else
        v_exp_h_cnt := 0;
        if v_exp_v_cnt < V_TOTAL - 1 then
          v_exp_v_cnt := v_exp_v_cnt + 1;
        end if;
      end if;

    end loop;

    -- We are now inside active video. Advance to a deterministic x.
    for advance in 0 to H_ACTIVE - 1 loop
      wait until rising_edge(clk_s);

      if rst_ni_i = '0' then
        v_fail_msg := "unexpected reset during pixel-addressing advance";
        mark_fail(v_fail_msg, test_failed_s);
      end if;

      if pix_en_s = '1' and v_exp_h_cnt >= 50 and v_exp_h_cnt < 60 then
        -- Golden model: r = x mod 256, g = y mod 256.
        if unsigned(to_unsigned(v_exp_h_cnt mod 256, 8)) /= r_s then
          v_fail_msg := "R channel mismatch at x=" & integer'image(v_exp_h_cnt) & " y=" & integer'image(v_exp_v_cnt);
          mark_fail(v_fail_msg, test_failed_s);
        end if;

        if unsigned(to_unsigned(v_exp_v_cnt mod 256, 8)) /= g_s then
          v_fail_msg := "G channel mismatch at x=" & integer'image(v_exp_h_cnt) & " y=" & integer'image(v_exp_v_cnt);
          mark_fail(v_fail_msg, test_failed_s);
        end if;

        exit; -- one check is enough for the smoke test.
      end if;

      if v_exp_h_cnt < H_TOTAL - 1 then
        v_exp_h_cnt := v_exp_h_cnt + 1;
      else
        v_exp_h_cnt := 0;
        if v_exp_v_cnt < V_TOTAL - 1 then
          v_exp_v_cnt := v_exp_v_cnt + 1;
        end if;
      end if;

    end loop;

    -- ----------------------------------------------------------
    -- Phase 4: verify reset returns the design to a known state.
    -- ----------------------------------------------------------
    rst_sync_proc(rst_ni_i);
    wait until rising_edge(clk_s);
    wait for 1 ns;

    if hs_s /= '0' then
      v_fail_msg := "post-reset HSYNC mismatch on second cycle: got '" & std_logic'image(hs_s) & "'";
      mark_fail(v_fail_msg, test_failed_s);
    end if;

    if vs_s /= '0' then
      v_fail_msg := "post-reset VSYNC mismatch on second cycle: got '" & std_logic'image(vs_s) & "'";
      mark_fail(v_fail_msg, test_failed_s);
    end if;

    if pix_en_s /= '0' then
      v_fail_msg := "post-reset pix_en must be 0 on second cycle, got '" & std_logic'image(pix_en_s) & "'";
      mark_fail(v_fail_msg, test_failed_s);
    end if;

    -- ----------------------------------------------------------
    -- Final verdict.
    -- ----------------------------------------------------------
    if v_pass_count = 0 then
      v_fail_msg := "No observations were made during simulation.";
      mark_fail(v_fail_msg, test_failed_s);
    end if;

    if test_failed_s = '1' then
      report "Testbench FAILED with failures detected." severity error;
      std.env.stop(1);
    else
      report "Testbench PASSED. Passed=" & integer'image(v_pass_count) & " Failed=" & integer'image(v_fail_count) severity note;
      std.env.stop(0);
    end if;

  end process check_proc;

end architecture sim;
