---
Categories:
    - Python
Description: Terminal Emulators Battle Royale 2025: The Errant Champions Strike Back
Tags:
    - Python
    - Unicode
    - terminal
    - ucs-detect
    - wcwidth
date: 2025-11-01T00:00:00Z
menu: main
title: Terminal Emulators Battle Royale 2025: The Errant Champions Strike Back
---

This is a follow-up to my previous article, `Terminal Emulators Battle Royale –
Unicode Edition!`_ from 2023, which documented Unicode support across terminal
emulators. Since then, the ucs-detect_ tool and its supporting blessed_ library
have been extended to detect support of `DEC Private Modes`_, `sixel graphics`_,
`pixel size`_, and `software version`_.

The ucs-detect_ program tests terminal cursor positioning by sending visible
text followed by control sequences that request the cursor position. The
terminal responds by writing the cursor location as simulated keyboard input.
ucs-detect reads and compares these values as measurements against the python
wcwidth_ library result, logging any discrepancies.

The Gentleman Errant
====================

Before presenting the latest results, Ghostty_ warrants particular attention.
Released this year by Mitchell Hashimoto, it represents a significant
advancement in terminal emulation. Developed from scratch in zig_, the
implementation is Modern and thorough, demonstrating strong Unicode support.

In 2023 Mitchell published `Grapheme Clusters and Terminal Emulators`_,
demonstrating a commitment to understanding and implementing the fundamentals.
The related announcement of libghostty_ provides a needed alternative to libvte,
potentially enabling a new generation of terminal implementations that share a
foundation of strong Unicode support and modern features. The reference
implementation scores well in our tests.

The Errant Champion
===================

Kovid Goyal's Kitty_ scored the highest among all terminals tested. Additionally,
he published a `text-splitting algorithm description`_ for Kitty_ that closely
matches the Python wcwidth specification_, which is unsurprising as both derive
from careful interpretation of unicode.org standards.

Kitty_ is the only terminal that correctly supports `Variation Selector 15`_, which
will be released for Python wcwidth now that we have a reference implementation.

Variable-Sized Text
===================

`The text sizing protocol`_ published early this year represents a significant
development for terminal emulation. Kovid describes `in a recent interview`_:

> And then my next windmill that I'm looking at is variable-sized text in the
> terminal. So when I'm catting a markdown file, I want to see the headings big
> and. Like in emacs, right? Yes, yes. So why should only emacs user benefit.

Current terminals cannot fundamentally reproduce many of the world's languages
in a readable fashion because they constrain poorly to monospace cells and
the measurements dictated by rapidly expanding Unicode standards and
their varying levels of practical implementation.

Although this feature may be impressive for more advanced typesetting-like
features in terminal editors and applications, it more importantly provides
a promising solution for *legible* support of the world's minority languages.

Testing Results
===============

[placeholder: table or summary of results with columns for terminal name,
unicode support score, performance time, version tested]

[placeholder: link to full results documentation]

The Long Road
=============

The most notable finding is performance.  That many terminals perform so slowly
was surprising, so I have also included the elapsed time in the results.

iTerm2 consumes a full CPU core and performs so slowly that the test parameters
were reduced to complete under one hour what other terminals complete in minutes.

Gnome Terminal and its VTE-based derivatives also perform too slowly for a
full-sized test, though they consume very little CPU while doing so and may be
tested simultaneously. All libvte-based terminals have identical results.

Many terminals exhibit stalls or inefficiencies in their event loops that
make for slow automatic response, but we should be forgiving, nobody really
considered the need to handle hundreds of answer-back sequences per second.

I expected Python wcwidth_ to consume most CPU resources during testing, as it
is frequently called and always the "highest-level" language in the mix, but
it keeps up pretty well for a majority of the terminals.

Earlier this year, I dedicated effort to optimizing wcwidth_ using techniques
including bit vectors, bloom filters, and varying sizes of LRU_ caches. The
results confirmed that the existing implementation, `a binary search`_ with a
functools.lru_cache_ decorator—performed best.

The LRU_ cache is effective because human languages typically use a small,
repetitive subset of Unicode. ucs-detect_ tests hundreds of languages from the
UDHR dataset, excluding only those without any interesting combining or wide
characters, providing an extreme but practical demonstration of LRU cache
benefits when processing Unicode.

I previously `considered distributing`_ a C module with Python wcwidth_ for greater
performance, but the existing Python implementation keeps up with some of the
faster terminals, when text scroll speed appears fast enough to produce screen
tearing artifacts.

Tilting at Edges
================

Terminology_ produces inconsistent results between executions. Our tests are
designed to be deterministic, so one implementation contains a significant bug.
Despite this issue, Terminology offers interesting visual effects that would be
welcome in other terminals.

iTerm2_ may report "supported, but disabled, and cannot be changed" status for
all `DEC Private Modes`_ queried, including fictional modes like ``9876543``.

For this reason, the summary of DEC Private Modes shows only those modes that
are either ``enabled``, or currently disabled but ``may enable``.

Konsole_ does not reply to support queries for `DEC Private modes`_, but does
support several modes when enabled anyway. For this reason, ucs-detect_ cannot
infer Konsole's supported DEC Modes automatically.

Similarly, ucs-detect_ and display-modes.py_ from blessed_ both reported "No DEC
Private Mode Support" for Contour_. I investigated this discrepancy given that
Contour's author also authored a `Mode 2027`_ specification dependent on this
functionality.

The issue was that blessed_ timed out when Contour responded with an unexpected
pattern—a different mode number than the one queried. While developing a fix,
which has been submitted, the latest release of Contour from December 2024
presented an additional complication: `a bad escape key configuration`_. Each
instance of being stuck in vi required typing ``CTRL + [`` as a workaround.

Terminals based on libvte_ with software version label ``VTE/7600`` continue to
show identical performance in our tests, unchanged from 2023.

My `sincere discussion`_ proposing Unicode support improvements in libvte was met
with substantial criticism by Egmont Koblinger. However, Egmont's recent issue
`Support Emoji Sequences`_ in libvte indicates that proper Emoji support may
arrive in many popular terminals during 2026.

On Mode 2027
============

I included DEC Private `Mode 2027`_ to accompany Mitchell's table in `Grapheme
Clusters and Terminal Emulators`_, and to verify for myself that it has limited
utility--when available, it is already enabled. A CLI program can query this
mode to classify a terminal as "reasonably modern". It is, however, only a rough
indicator of Unicode support.

The results of ucs-detect demonstrate that Unicode support levels vary widely
among terminals. Those that report support for `Mode 2027`_ ("Grapheme clustering")
exhibit varying levels of actual support that closely match terminals that do
*not* report supporting it.

The only practical approach to determining Unicode support of a terminal is to
interactively test for specific Unicode features such as ZWJ, VS16, or specific
wide codepoints at the Unicode version levels of interest, as done by ucs-detect_.
Terminals like Terminology may have varying percentages of support at each
individual version level, while low-support but high-performing terminals like
the Linux Framebuffer may display some Unicode characters at the correct width
but remain otherwise illegible.

Emojis introduced substantial workload and expectations for open source
developers. Rendering them was straightforward; reasoning about them was not.
As a side-effect, high demand for emoji support has increased general Unicode
support in terminals, improving accessibility for minority languages. My
development of wcwidth was driven by terminal applications corrupting user
input when wide or emoji characters or sequences occurred on the same line as
an editing cursor.

.. _`a bad escape key configuration`: https://github.com/contour-terminal/contour/issues/1710
.. _`a binary search`: https://github.com/jquast/wcwidth/blob/5ba540df3386255dcde94bf867665ddf1cab868f/wcwidth/wcwidth.py#L76-L145
.. _blessed: https://blessed.readthedocs.io/
.. _Contour: https://contour-terminal.org/
.. _`DEC Private Modes`: https://blessed.readthedocs.io/en/latest/dec_modes.html
.. _display-modes.py: https://blessed.readthedocs.io/en/latest/examples.html#display-modes-py
.. _functools.lru_cache: https://docs.python.org/3/library/functools.html#functools.lru_cache
.. _Ghostty: https://ghostty.org/
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
.. _`The text sizing protocol`: https://sw.kovidgoyal.net/kitty/text-sizing-protocol/
.. _ucs-detect: https://github.com/jquast/ucs-detect
.. _`Variation Selector 15`: https://unicode.org/reports/tr51/#Emoji_Variation_Sequences
.. _wcwidth: https://github.com/jquast/wcwidth
.. _zig: https://ziglang.org/
.. _`considered distributing`: https://github.com/jquast/wcwidth/issues/103
