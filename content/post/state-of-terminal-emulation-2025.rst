---
Categories:
    - Python
Description: State of Terminal Emulators in 2025: The Errant Champions
Tags:
    - Python
    - Unicode
    - terminal
    - ucs-detect
    - wcwidth
date: 2025-11-02T00:00:00Z
menu: main
title: State of Terminal Emulators in 2025: The Errant Champions
---

This is a follow-up to my previous article, `Terminal Emulators Battle Royale –
Unicode Edition!`_ from 2023, in which I documented Unicode support across terminal
emulators. Since then, the ucs-detect_ tool and its supporting blessed_ library
have been extended to automatically detect support of `DEC Private Modes`_, `sixel graphics`_,
`pixel size`_, and `software version`_.

The ucs-detect_ program tests terminal cursor positioning by sending visible
text followed by control sequences that request the cursor position. The
terminal responds by writing the cursor location as simulated keyboard input.
ucs-detect reads and compares these values against the Python
wcwidth_ library result, logging any discrepancies.

The Width Problem
=================

Terminal emulators face a fundamental challenge: mapping the vast breadth of
Unicode scripts into a fixed-width grid while maintaining legibility. A terminal
must predict whether each character occupies one cell or two, whether combining
marks overlay previous characters, and how emoji sequences collapse into single
glyphs.

These predictions fail routinely. Writing systems designed for variable-width
typesetting resist confinement to monospace cells. Zero-width joiners, variation
selectors, and grapheme clusters compound the complexity. When terminals and CLI
applications guess wrong, text becomes unreadable - cursors misalign, lines
overflow, and editing breaks.

The Gentleman Errant
====================

Before presenting the latest results, Ghostty_ warrants particular attention.
Released this year by Mitchell Hashimoto, it represents a significant
advancement in terminal emulation. Developed from scratch in zig_, the
implementation is modern and thorough, demonstrating strong Unicode support.

In 2023, Mitchell published `Grapheme Clusters and Terminal Emulators`_,
demonstrating a commitment to understanding and implementing the fundamentals.
The related announcement of libghostty_ provides a welcome alternative to libvte_,
potentially enabling a new generation of terminal implementations that share a
foundation of strong Unicode support and modern features. It scores well in our tests.

The Errant Champion
===================

Kovid Goyal's Kitty_ scored the highest among all terminals tested. Additionally,
a `text-splitting algorithm description`_ was published for Kitty_ that closely
matches the Python wcwidth specification_, which is unsurprising as both derive
from careful interpretation of Unicode.org_ standards.

Kitty_ is the only terminal that correctly supports `Variation Selector 15`_, which
will be released for Python wcwidth now that we have a reference implementation.

Testing Results
===============

[placeholder: table or summary of results with columns for terminal name,
unicode support score, performance time, version tested]

[placeholder: link to full results documentation]

The Long Road
=============

The most notable finding relates to performance.  That many terminals perform so slowly
was surprising, so I have included the elapsed time in the results.

iTerm2_ and Extraterm_ consume a majority of the CPU and performs so slowly that
the test parameters were reduced to finish within the hour what many other
terminals manage in a few minutes.

`GNOME Terminal`_ and its VTE-based derivatives also perform too slowly for a
full test, taking over 5 hours in my testing, though they consume very little
CPU while doing so and may be tested simultaneously.  Many terminals exhibit
stalls or inefficiencies in their event loops that result in slow automatic
responses, but we should be forgiving; nobody really considered the need to
handle hundreds of automatic sequence replies per second!

I expected Python wcwidth_ to consume most CPU resources during testing, as it
is frequently called and always the "highest-level" language in the mix, but
it keeps up pretty well for most terminals.

Earlier this year, I dedicated effort to optimizing wcwidth_ using techniques
including bit vectors, bloom filters, and varying sizes of LRU_ caches. The
results confirmed that the existing implementation performed best: a `binary
search`_ with a functools.lru_cache_ decorator.

The LRU_ cache is effective because human languages typically use a small,
repetitive subset of Unicode. The ucs-detect_ tool tests hundreds of languages
from the `UDHR dataset`_, excluding only those without any interesting zero
or wide characters. This dataset provides an extreme but practical demonstration
of LRU cache benefits when processing Unicode.

I previously `considered distributing`_ a C module with Python wcwidth_ for
greater performance, but the existing Python implementation keeps up well enough
with the fastest terminals, when fully exhausted the text scroll speed is fast
enough to produce screen tearing artifacts.

Tilting at Edges
================

Terminology_ produces inconsistent results between executions. Our tests are
designed to be deterministic, so these kinds of results suggest possible state
corruption. Despite this issue, Terminology offers interesting visual effects
that would be welcome in other terminals.

iTerm2_ may report "supported, but disabled, and cannot be changed" status for
all `DEC Private Modes`_ queried, including fictional modes like ``9876543``.
For this reason, the summary of DEC Private Modes shows only those modes that
are changeable.

Konsole_ does not reply to support queries for `DEC Private modes`_, but does
support several modes when they are enabled. For this reason, ucs-detect_ cannot
automatically infer which DEC Modes Konsole supports.

Similarly, ucs-detect_ and display-modes.py_ from blessed_ both reported "No DEC
Private Mode Support" for Contour_. I investigated this discrepancy because
Contour's author also authored a `Mode 2027`_ specification dependent on this
functionality.

The issue was that blessed_ timed out when Contour responded with an unexpected
pattern -- a different mode number than the one queried. While developing `a fix`_,
Contour's latest release from December 2024 presented an additional
complication: `a bad escape key configuration`_. Each instance of being stuck
in vi required typing ``CTRL + [`` as a workaround.

Terminals based on libvte_ with software version label ``VTE/7600`` continue to
show identical performance in our tests, unchanged from 2023.

My `sincere discussion`_ proposing Unicode support improvements in libvte received
substantial criticism from Egmont Koblinger. However, Egmont's recent issue
`Support Emoji Sequences`_ in libvte indicates that proper Emoji support may
arrive in many popular terminals during 2026.

On Mode 2027
============

I included DEC Private `Mode 2027`_ to accompany Mitchell's table in `Grapheme
Clusters and Terminal Emulators`_, and to verify for myself that it has limited
utility, as it is already enabled when available. A CLI program can query this
mode to classify a terminal as "reasonably supporting" unicode, but not of what
feature of version level. It remains then as only a rough indicator of general
Unicode support.

The only practical approach to determining Unicode support of a terminal is to
interactively test for specific Unicode features such as ZWJ, VS16, or specific
codepoints at the Unicode version levels of interest, as ucs-detect_ does.

Terminals like Terminology_ may have varying percentages of support at each
individual version level, and, that there is more to measured width, but
legibility -- although terminals may sometimes accidentally display them
with the correct width, they may not be legible.

Beyond Fixed Widths
===================

Terminals cannot reproduce many of the world's languages legibly when constrained
to monospace cells. The measurements dictated by rapidly expanding Unicode standards
and varying implementation levels create inherent tension.

`The text sizing protocol`_ published early this year represents a significant
development that could resolve these constraints. Kovid Goyal describes the motivation
`in a recent interview`_:

> And then my next windmill that I'm looking at is variable-sized text in the
> terminal. So when I'm catting a markdown file, I want to see the headings big
> and. Like in Emacs, right? Yes, yes. So why should only Emacs users benefit.

.. image:: https://img.youtube.com/vi/8PYLPC3dzWQ/maxresdefault.jpg
   :target: https://www.youtube.com/watch?v=8PYLPC3dzWQ
   :alt: Interview with Kovid Goyal about Kitty terminal

While this feature may enable more advanced typesetting-like capabilities in
terminal apps, it is also promising in increasing accessibility. Allowing text
to escape monospace constraints enables legible support of the diverse set of
the world's languages.


.. _`a bad escape key configuration`: https://github.com/contour-terminal/contour/issues/1710
.. _`a binary search`: https://github.com/jquast/wcwidth/blob/5ba540df3386255dcde94bf867665ddf1cab868f/wcwidth/wcwidth.py#L76-L145
.. _`a fix`: https://github.com/contour-terminal/contour/pull/1797
.. _blessed: https://blessed.readthedocs.io/
.. _Contour: https://contour-terminal.org/
.. _`DEC Private Modes`: https://blessed.readthedocs.io/en/latest/dec_modes.html
.. _display-modes.py: https://blessed.readthedocs.io/en/latest/examples.html#display-modes-py
.. _functools.lru_cache: https://docs.python.org/3/library/functools.html#functools.lru_cache
.. _Ghostty: https://ghostty.org/
.. _`GNOME Terminal`: https://help.gnome.org/users/gnome-terminal/stable/
.. _`Grapheme Clusters and Terminal Emulators`: https://mitchellh.com/writing/grapheme-clusters-in-terminals
.. _`in a recent interview`: https://www.youtube.com/watch?v=8PYLPC3dzWQ
.. _iTerm2: https://iterm2.com/
.. _Kitty: https://sw.kovidgoyal.net/kitty/
.. _Konsole: https://apps.kde.org/konsole/
.. _libghostty: https://mitchellh.com/writing/libghostty-is-coming
.. _libvte: https://gitlab.gnome.org/GNOME/vte
.. _LRU: https://en.wikipedia.org/wiki/Page_replacement_algorithm#Least_recently_used
.. _`Mode 2027`: https://github.com/contour-terminal/terminal-unicode-core/blob/master/spec/terminal-unicode-core.tex
.. _`pixel size`: https://blessed.readthedocs.io/sixel.html#window-dimensions
.. _`Python wcwidth specification`: https://wcwidth.readthedocs.io/en/latest/specs.html
.. _`sincere discussion`: https://gitlab.gnome.org/GNOME/vte/-/issues/2580#note_1973274
.. _`sixel graphics`: https://blessed.readthedocs.io/sixel.html
.. _`software version`: https://blessed.readthedocs.io/terminal.html#terminal-software-version
.. _`Support Emoji Sequences`: https://gitlab.gnome.org/GNOME/vte/-/issues/2909
.. _`Terminal Emulators Battle Royale – Unicode Edition!`: https://www.jeffquast.com/post/ucs-detect-test-results/
.. _Terminology: https://www.enlightenment.org/about-terminology
.. _`text-splitting algorithm description`: https://sw.kovidgoyal.net/kitty/text-sizing-protocol/#the-algorithm-for-splitting-text-into-cells
.. _`UDHR dataset`: https://github.com/eric-muller/udhr/tree/main
.. _`The text sizing protocol`: https://sw.kovidgoyal.net/kitty/text-sizing-protocol/
.. _ucs-detect: https://github.com/jquast/ucs-detect
.. _Unicode.org: https://unicode.org/
.. _`Variation Selector 15`: https://unicode.org/reports/tr51/#Emoji_Variation_Sequences
.. _wcwidth: https://github.com/jquast/wcwidth
.. _zig: https://ziglang.org/
.. _`considered distributing`: https://github.com/jquast/wcwidth/issues/103
.. _`Extraterm`: https://extraterm.org/
