---
Categories:
    - Python
    - Terminal
Description: A comprehensive account of wcwidth 0.8.0, correction tables, and terminal identification
Tags:
    - Python
    - Unicode
    - wcwidth
    - terminal
    - wcstwidth
    - ucs-detect
    - grapheme
    - Mode 2027
    - KTSP
date: 2026-06-07T00:00:00Z
menu: main
title: Perfecting Terminal Character Width Using Correction Tables
---

Measuring terminal Unicode width has always been a difficult problem. Per-terminal correction
tables make near-perfect accuracy possible.

In past years, I have published a specification_ of Python wcwidth, and Kovid Goyal has published
`"The algorithm for splitting text into cells"`_ as part of the Kitty Text Sizing protocol.

Terminal emulator authors have agreed to disagree on many broad interpretations of Unicode
standards, such as whether emoji should be supported at all, down to the very fine details
of individual codepoints, categories, and grapheme widths.

We continue to await Fraser Gordon of the Unicode Text Terminal Working Group to publish standards.
After 12 and 6 years of improving the Python wcwidth_ and ucs-detect_ libraries, I suggest the "Terminal Unicode
Width" problem cannot be solved by clear specification, implementation, and compliance reporting
alone.

Modelike 2027
=============

The design of DEC Private Mode 2027 (`Grapheme Clustering`_, 2021) is a binary indicator of whether
a terminal reports to support grapheme clustering.  Hashimoto's `Grapheme Clusters and Terminal
Emulators`_ (2023) explains the mode plainly for a single ZWJ codepoint.

But grapheme support is *not* a binary indicator of terminal width measurements. With ``ucs-detect``, I
have measured:

- 23 implementations of which codepoints are Wide (WIDE).
- 21 implementations of language grapheme support (LANG).
- 19 implementations of complex emoji joined with a Zero-Width Joiner (ZWJ): 👩🏻‍❤‍💋‍👩🏿.
- 7 and 6 implementations of widths of emojis combined with Variation Selector-15 and 16: ❤️.
- 2 implementations of standalone Fitzpatrick (SFZ): 🏻🏼🏽🏾🏿
- 2 implementations of standalone Regional Indicators (SRI): 🇸.
- 2 implementations of Zero-Width for invisible Format characters (Cf).

.. figure:: /images/mode2027nosupport-zwj-errors.png
   :target: /images/mode2027nosupport-zwj-errors.png
   :align: center

   Linux screenshots XTerm, Gnome, Konsole, and Rio without Mode 2027 support

Among terminals enabled for mode 2027, there is still some variance, though mild:

- 6 implementations of language grapheme support (LANG).
- 5 implementations of which characters are Wide (WIDE).
- Contour measures 54 emoji with Zero-Width Joiners (ZWJ) as Narrow instead of Wide.
- Contour and WezTerm are missing Variation-Selector 16 (VS16) support for *some* early emojis: #️*️0️1️2️3️4️5️6️7️8️9️
- foot, WezTerm, and Windows Terminal measure standalone Regional Indicators (SRI) as Narrow instead of Wide.
- foot and Windows Terminal measure Fitzpatrick modifiers (🏻🏼🏽🏾🏿) as width of 1 instead of 2.
- 14 Format characters (Category Cf) are in dispute as width 1 or 0 for many terminals.

.. figure:: /images/mode2027-zwj-errors.png
   :target: /images/mode2027-zwj-errors.png
   :align: center

   Linux screenshots of Mode 2027-enabled Ghostty, foot, WezTerm, and Contour

Varying feature and version support levels of Unicode are likely to expand and diversify over time.
The results of ``ucs-detect`` show that any specialized "with or without" grapheme width function is
not reasonable. My answer is `wcstwidth()`_, which corrects width measurements for the terminal in use.

Correction Tables
=================

My most important work this year is the new ``wcstwidth()`` function, a variant of the Python wcwidth
library `wcswidth()`_ function that provides **corrected width** measurements **by the terminal
software** used to call it.

This is made possible by ``ucs-detect``, which across approximately 35 terminals reports every
measurement that deviates from wcwidth's specification; ``wcstwidth()`` makes use of this data in the form of "correction
tables" to return a "corrected" measurement:

.. code-block:: python

    >>> import wcwidth
    >>> wcwidth.wcwidth('🧟‍♂')
    2
    >>> wcwidth.wcstwidth('🧟‍♂', term_program='VTE')
    8

This work is needed at least until the Kitty Text Sizing Protocol is supported by a majority of
terminals, or until the Unicode Terminal WG begins to publish standards that are then also adopted
by a majority of terminals.

In `movwin: My (unpublished) TUI
framework <https://movq.de/blog/postings/2026-05-29/0/POSTING-en.html>`_ movq wrote

    movwin must know how many cells in the terminal a Unicode sequence will (probably) occupy. The big
    problem here is that this depends on the terminal, so it can't ever be perfect.

Challenge accepted: I propose that it **can** be perfect!

Kitty Text Sizing Protocol
==========================

A complementary general-purpose solution to the sizing problem is the `Kitty Text Sizing Protocol`_ (KTSP).
By surrounding the text with a KTSP sequence, reliable width presentation of graphemes beyond 2
cells is possible:

.. figure:: /images/ktsp-virama-width-4-corrected.png
   :align: center
   :target: /images/ktsp-virama-width-4-corrected.png

   Screenshot of the Python blessed_ library method `text_sized()`_ to correct a width of 4
   for a very wide Virama using the Kitty Text Sizing Protocol.

This technique of correcting for complex scripts using KTSP is written about in more detail in
`Rendering complex scripts in terminal and OSC 66`_ (Thottingal, 2026).

This is a very good solution for general text sizing issues in terminals; I hope to see it
integrated into more TUI applications as a solution to the general problem of emoji/grapheme width
in more REPLs, text editors, and terminals.

I've integrated it into my own public projects, adding `does_text_sizing()`_ and `text_sized()`_ to the
``blessed`` library to detect and construct KTSP sequences, updating the wcwidth library's
`width()`_ function to measure width of text containing KTSP sequences, so that it may be aligned with any of
the `center()`_, `ljust()`_, `rjust()`_ and high-level functions `wrap()`_ and `clip()`_.

I have also changed ``ucs-detect`` to report scores as '100' (perfect) for Unicode categories when KTSP is supported.

.. figure:: https://dxtz6bzwq9sxx.cloudfront.net/blessed_text_sizing.gif
   :align: center
   :target: https://blessed.readthedocs.io/en/latest/examples.html#scroller-py

   ``blessed`` demonstration script, ``scroller.py`` showing a classic demoscene scroller effect using the
   text sizing protocol

Identification
==============

There is one drawback: we can only provide corrections for terminals that can be identified.

For terminals with a unique ``TERM`` environment value, alacritty, contour, foot, rio, rxvt, screen,
st, tmux, ghostty, and kitty, this is fairly reliable, as ``TERM`` is forwarded over almost all
protocols (SSH, Telnet, even rlogin), though some connections such as serial do not forward ``TERM``.

The ``TERM_PROGRAM`` environment variable uniquely identifies Apple Terminal, Hyper, iTerm.app,
mintty, Tabby, terminology, vscode (xterm.js), WarpTerminal, and WezTerm. However, ``TERM_PROGRAM``
is not forwarded over SSH without `ssh_config(5)`_ ``SendEnv`` and `sshd_config(5)`_ ``AcceptEnv``
configuration, so it is not reliable for remote connections.

The most reliable method of identifying a terminal over any protocol is by querying XTVERSION_
(``'\x1b[>q'``), supported by 21 terminals. PuTTY, Extraterm, and rxvt still respond to the older
ENQ_ (``'\05'``) with an automatic "answerback" response. The ``ENQ`` sequence is responsible for
the confusing insert of a ``PuTTYPuTTYPuTTYPuTTY`` into your shell prompt after accidentally
displaying binary data.

It is also possible to rapidly identify a terminal by querying the terminal with the Cursor Position
Report sequence while using a binary-search of known Unicode measurement quirks.

Terminal Multiplexers
=====================

Terminal multiplexers are excluded from offering correction tables for the same reason I exclude
them from my personal workflow: their results are inconsistent depending on the host terminal
and often confuse their cursor position.

``ucs-detect`` tests these multiplexers using ghostty as a "host terminal", but their displayed width
and cursor location will vary depending on the host terminal, and automatic replies of the cursor
position report can become mismatched to their actual position.

.. figure:: /images/zellij-cursor-position-misreport.png
   :target: /images/zellij-cursor-position-misreport.png
   :align: center

   Alignment issues compound with terminal multiplexers.  As seen in the above screenshot, the host
   terminal (ghostty) displays the expected alignment, but the terminal multiplexer (Zellij) has
   responded by "Cursor Position Report" that this regional indicator, ``🇳``, has advanced the
   cursor only 1 cell, in disagreement with the host terminal's 2.

API improvements
================

The Python ``wcswidth()`` function was redefined long ago, straying from POSIX:

    This implementation differs from Markus Kuhn's original POSIX C implementation, in that this
    ``wcswidth()`` processes grapheme strings returned by `iter_graphemes()`_ defined by `Unicode
    Standard Annex #29`_. POSIX `wcswidth(3)`_ is not grapheme-aware and does not measure many kinds
    of emoji or complex scripts correctly.

The existing ``wcswidth()`` interface is a natural fit to measure a series of codepoints by their
grapheme boundaries. The context of surrounding codepoints is required to accurately measure them,
and the grapheme boundary is a standards-defined break.

POSIX `wcwidth(3)`_ and ``wcswidth(3)`` return ``-1`` for C0 and C1 control codes like ``TAB`` or
sequences beginning with ``ESC``.  This signals the caller to manage these "terminal functions"
itself. In practice, many TUI applications just sum the results, discarding -1 values.

After auditing all downstream uses of ``wcswidth()``, `I wrote
<https://github.com/jquast/wcwidth/issues/79#issuecomment-1741605552>`_, "about every downstream
library has some issue with the POSIX wcwidth and wcswidth functions." regarding correct
handling of the possible -1 return values.

I made several new releases to address common needs:

- An easy-to-use ``width()`` function as a wrapper around ``wcswidth()`` capable of measuring most
  terminal control codes and sequences, like colors, bold, tabstops, and horizontal cursor movement.
- Text-justification functions ``ljust()``, ``rjust()``, ``center()``, and the grapheme-aware function
  ``wrap()``, serving as drop-in replacements for Python standard functions.
- `strip_sequences()`_ removes terminal escape sequences from text altogether.
- ``clip()`` for substrings by *displayed column positions*.
- ``iter_graphemes()`` and `iter_sequences()`_ for careful navigation of graphemes and terminal
  sequences as required by editors or REPLs with cursor control, and its complementary
  `iter_graphemes_reverse()`_ and `grapheme_boundary_before()`_ functions for backward cursor
  control.

I then suggested and contributed improvements to many downstream dependencies:
`asciimatics#396 <https://github.com/peterbrittain/asciimatics/pull/396>`_,
`prettytable#440 <https://github.com/prettytable/prettytable/pull/440>`_,
`prettytable#452 <https://github.com/prettytable/prettytable/pull/452>`_,
`Pylsy#42 <https://github.com/leviathan0992/Pylsy/pull/42>`_,
`pyte#206 <https://github.com/selectel/pyte/pull/206>`_,
`pytermgui#166 <https://github.com/bczsalba/pytermgui/pull/166>`_,
`python-ftfy#227 <https://github.com/rspeer/python-ftfy/pull/227>`_,
`python-prompt-toolkit#2045 <https://github.com/prompt-toolkit/python-prompt-toolkit/pull/2045>`_,
`rich#3956`_,
`table2ascii#137 <https://github.com/DenverCoder1/table2ascii/pull/137>`_,
and `urwid#1100 <https://github.com/urwid/urwid/pull/1100>`_,

.. figure:: /images/rich-before-and-after.png
   :target: /images/rich-before-and-after.png
   :align: center

   Before and after screenshots of ``rich#3956``.

Setting limits on Grapheme widths
=================================

Prior to wcwidth 0.8.0, a single grapheme could measure as wide as 3, 4, or even 5 cells. This
was driven by a complex Virama conjunct algorithm for Brahmic scripts such as Javanese, where a
sequence of consonant, virama, consonant, and combining mark (Mc) could accumulate width. The
algorithm roughly matched web browser width of Virama.

``ucs-detect`` testing of approximately 35 terminals revealed a clear pattern: most grapheme-aware
terminals supporting Mode 2027 rarely advance a single grapheme beyond 2 cells. And so the
``specification`` and implementation of wcwidth 0.8.0 have been updated with the rule, "Any grapheme
cluster width is limited to 2 cells since 0.8.0" to match majority support.

Crushing long Virama chains into two cells is often illegible. It is, nevertheless, a fair
compromise for the typewriter and teletype cellular grid constraints of a terminal design.

Continuing On
=============

These correction tables have been years in the making. I hope they serve you well. If you'd like to
browse unicode and the correction tables yourself, try ucs-browser_ and use ``'t'`` hotkey to toggle
correction tables::

    uvx --from ucs-detect ucs-browser

If you found this work useful, please consider sponsering_ me on GitHub.

.. _blessed: https://blessed.readthedocs.io/
.. _center(): https://wcwidth.readthedocs.io/en/latest/api.html#wcwidth.center
.. _clip(): https://wcwidth.readthedocs.io/en/latest/api.html#wcwidth.clip
.. _does_text_sizing(): https://blessed.readthedocs.io/en/latest/measuring.html#text-sizing
.. _ENQ: https://en.wikipedia.org/wiki/Enquiry_character
.. _grapheme_boundary_before(): https://wcwidth.readthedocs.io/en/latest/api.html#wcwidth.grapheme_boundary_before
.. _`Grapheme Clusters and Terminal Emulators`: https://mitchellh.com/writing/grapheme-clusters-in-terminals
.. _iter_graphemes(): https://wcwidth.readthedocs.io/en/latest/api.html#wcwidth.iter_graphemes
.. _iter_graphemes_reverse(): https://wcwidth.readthedocs.io/en/latest/api.html#wcwidth.iter_graphemes_reverse
.. _iter_sequences(): https://wcwidth.readthedocs.io/en/latest/api.html#wcwidth.iter_sequences
.. _KTSP: https://sw.kovidgoyal.net/kitty/text-sizing-protocol/
.. _ljust(): https://wcwidth.readthedocs.io/en/latest/api.html#wcwidth.ljust
.. _Rendering complex scripts in terminal and OSC 66: https://thottingal.in/blog/2026/03/22/complex-scripts-in-terminal/
.. _rjust(): https://wcwidth.readthedocs.io/en/latest/api.html#wcwidth.rjust
.. _scroller.py: https://blessed.readthedocs.io/en/latest/examples.html#scroller-py
.. _sponsering: https://github.com/sponsors/jquast
.. _ssh_config(5): https://man7.org/linux/man-pages/man5/ssh_config.5.html
.. _sshd_config(5): https://man7.org/linux/man-pages/man5/sshd_config.5.html
.. _strip_sequences(): https://wcwidth.readthedocs.io/en/latest/api.html#wcwidth.strip_sequences
.. _`Grapheme Clustering`: https://github.com/contour-terminal/terminal-unicode-core/blob/master/spec/terminal-unicode-core.tex
.. _text_sized(): https://blessed.readthedocs.io/en/latest/measuring.html#text-sizing
.. _ucs-browser: https://ucs-detect.readthedocs.io/intro.html#ucs-browser
.. _ucs-detect: https://ucs-detect.readthedocs.io/intro.html#problem
.. _Unicode Standard Annex #29: https://unicode.org/reports/tr29/
.. _wcstwidth: https://wcwidth.readthedocs.io/en/latest/api.html#wcwidth.wcstwidth
.. _wcstwidth(): https://wcwidth.readthedocs.io/en/latest/api.html#wcwidth.wcstwidth
.. _wcswidth(3): https://man7.org/linux/man-pages/man3/wcswidth.3.html
.. _wcswidth(): https://wcwidth.readthedocs.io/en/latest/api.html#wcwidth.wcswidth
.. _wcswidth: https://wcwidth.readthedocs.io/en/latest/api.html#wcwidth.wcswidth
.. _wcwidth(3): https://man7.org/linux/man-pages/man3/wcwidth.3.html
.. _wcwidth: https://wcwidth.readthedocs.io/
.. _wcwidth.wcswidth: https://wcwidth.readthedocs.io/en/latest/api.html#wcwidth.wcswidth
.. _wcwidth.wcwidth: https://wcwidth.readthedocs.io/en/latest/api.html#wcwidth.wcwidth
.. _wcwidth.width: https://wcwidth.readthedocs.io/en/latest/api.html#wcwidth.width
.. _width(): https://wcwidth.readthedocs.io/en/latest/api.html#wcwidth.width
.. _width: https://wcwidth.readthedocs.io/en/latest/intro.html#width
.. _wrap(): https://wcwidth.readthedocs.io/en/latest/api.html#wcwidth.wrap
.. _`wrote briefly`: https://www.jeffquast.com/post/state-of-terminal-emulation-2025/
.. _XTVERSION: https://terminalguide.namepad.de/attr/xtversion/
.. _`Kitty Text Sizing Protocol`: <https://sw.kovidgoyal.net/kitty/text-sizing-protocol/>
.. _specification: https://wcwidth.readthedocs.io/en/latest/specs.html
.. _`"The algorithm for splitting text into cells"`: https://sw.kovidgoyal.net/kitty/text-sizing-protocol/#the-algorithm-for-splitting-text-into-cells
.. _`rich#3956`: https://github.com/Textualize/rich/pull/3956
