---
Categories:
    - Python
Description: Terminal Emulators Battle Royale – Unicode Edition!
Tags:
    - Python
    - Unicode
    - zero-width
    - fullwidth
    - wcwidth
    - UNICODE_VERSION
    - wcwidth
    - terminal
date: 2023-12-14T00:00:00Z
menu: main
title: Terminal Emulators Battle Royale – Unicode Edition!
---

It turns out that Unicode support in Terminals is a lot more difficult than it
first appears. A quick overview of special support for Unicode characters in
Terminals:

- "Wide" or "Fullwidth_" characters, particularly for East Asian languages and
  emojis, are codepoints that occupy two cells in a terminal instead of one.

- "Zero" width combining_ characters used in languages such as Arabic, Hebrew,
  or Hindi do not occupy any cells themselves; instead, they modify the previous
  character.

- "Zero Width Joiner" (ZWJ `U+200D`_) reduces and combines many codepoints into
  a single emoji.  This is similar to combining_, but encoded in a completely
  different way.

- "Variation Selector-16" (VS-16 `U+FE0F`_) is a special character that, for
  specific "Narrow" emojis consuming one cell, causes them to become "Wide",
  consuming two cells.

I share maintenance of the python wcwidth_ library, which is responsible for
determining the printable width of a string when displayed to a terminal. I
worked hard to close all open issues, adding support for VS-16, ZWJ, and several
bug fixes to the Zero-Width table definitions.  I now believe it to be the most
accurate implementation.

Additionally, I authored a formal Specification_ detailing how characters should
be measured.  Then, I updated the python ucs-detect_ tool to systematically asses
terminal emulators for their compliance with the specification.

Finally, I have `published results`_ for the most popular terminal emulators on
Linux, macOS, and Windows.  This article is a summary of my findings.

Wide Character support
======================

Across all unicode capabilities tested, Wide character support is best. This is
likely attributed to the widespread adoption of emojis, which are treated as wide
characters, generating interest across developers and users of *all* languages.

While all tested terminals demonstrate support for wide characters, there are
variations in the Unicode versions they support. Notably, Konsole_, iTerm2_,
and Kovid Goyal's kitty_ support wide characters up to Unicode release version
15.0.0 (2022). In contrast, Hyper_ and Visual Studio Code, both built on
`xterm.js`_, provide support only up to Unicode release 12.1.0 (2019).

This means that these wide characters take up 1 cell instead of 2, often
occluded by the next character.

.. image:: /images/hyper-wide.png

Pictured here in Hyper_ terminal, the wcwidth_ developer tool
`wcwidth-browser.py`_ shows several Wide Emoji mistakenly displayed as Narrow
instead of Wide, due to out-of-date code tables in `xterm.js`_, causing
partially occluded by the Pipe character (``|``).

The wcwidth project Specification_ describes Wide characters as::

> Any character defined by East Asian Fullwidth (F)
> or Wide (W) properties in EastAsianWidth txt
> files, except those that are defined by the
> Category codes of Nonspacing Mark (Mn) and
> Spacing Mark (Mc).

The "except" clarification is needed, as there are several characters officially
categorized as Wide or Fullwidth, but contradictory definitions of Zero by other
data files!

The definition continues::

> Any characters of Modifier Symbol category,
> 'Sk' where 'FULLWIDTH' is present in comment
> of unicode data file, aprox. 3 characters.

The definition is further expanded to include any characters falling within the
Modifier Symbol 'Sk' category, specifically those with 'FULLWIDTH' mentioned in
the comment field of the Unicode data file—approximately three characters in
total.

This clause is crucial for a small set of characters from the modifier symbol
category that, while not officially designated as Fullwidth or Wide, indeed
exhibit these properties. Detecting these characters necessitates parsing the
comment field of the data files.

The "Modifier Symbol" category is a strange category. It is a set of combining
characters that **do not** act as combining characters, they are for lone display,
**except** for the Emoji Modifier Fitzpatrick codepoints, which modify the
skin tone of the preceding Emoji in sequence, making it a kind of combining_
character unlike all other characters of this category.

How difficult!  The Unicode.org data files present contradictory
categorizations. It's no wonder that developers, even those that strive for full
compliance, can still encounter difficulty in accurately categorizing a small
percentage of characters.

Zero Width
==========


Testing support for Zero Width characters poses a particular challenge. While it
may be possible to combine some combining characters with any other Unicode
characters, like `U+0309 <https://codepoints.net/U+0309>`_ "Combining Hook
Above" with box drawing character `U+2532 <https://codepoints.net/U+2532>`_::

>          ┲̉

Hoever, this is not the case for *most* combining characters, which can only
combine with specific characters.  For instance, `U+094D
<https://codepoints.net/U+094D>`_ "Devanagari Sign Virama" successfully combines
with an appropriate Devanagari letter, like `U+0915
<https://codepoints.net/U+0915>`_ "Devanagari Letter Ka"::

>           क्

However, it fails to combine for non-Devanagari letters, such as `U+0061
<https://codepoints.net/U+0061>`_ "Latin Small Letter A"::

>           a्

The "dotted donut" depicted after "Latin Small Letter A" is used as a
placeholder for these illegal combinations.
 
.. image:: /images/iterm2-combining-latin.png

Depicted here in iTerm2_ are several combining characters after
`U+0007 <https://codepoints.net/U+0007>`_ "Latin Small Letter O", where many
fail to combine, resulting in the display of a "dotted donut".

To explore and visualize combining characters in a naive manner, you can use the
developer tool `wcwidth-browser.py`_ from the wcwidth repository. Press 'c'
after launch or use the CLI argument ``--combining``. However, this tool serves
primarily to demonstrate that naive combining is not feasible for a vast number
of characters.

A Rosetta Stone?
----------------

The Universal Declaration of Human Rights (UDHR_) is a remarkable document
translated to over 500 languages. The UDHR_ Unicode project curates a collection
of these translations, offering a valuable resource for testing support of
Zero-Width characters.

Outside of Emoji, we really only care about whether any particular language is
supported, and for many languages, Zero-Width characters are necessary to
properly write them.

Using the ucs-detect_ tool to display phrases from UDHR_ in each language and
measuring the displayed width, we can conduct a comprehensive test for
Zero-Width character support of each Terminal by Language.

Zero Width Results
------------------

The Windows-only terminals, `Terminal.exe`_, `cmd.exe`_, and ConsoleZ_,
as well as the cross-platform ExtraTermQt_ and for-pay commercial zoc_
terminal all fail to correctly display many Zero-Width characters, failing
for approximately 100 of the world's languages.

The common error of these terminals is that they account category codes
Nonspacing Mark (Mn) and Spacing Mark (Mc) as Narrow instead of Zero width.

One example of the Hindi language from ConsoleZ_ where the `U+093e`_
of 'Mc' category is incorrectly measured as Narrow:

=========================================  =========  ==========  =========  ========================
Codepoint                                  Python     Category      wcwidth  Name
=========================================  =========  ==========  =========  ========================
`U+092E <https://codepoints.net/U+092E>`_  '\\u092e'  Lo                  1  DEVANAGARI LETTER MA
`U+093e`_                                  '\\u093e'  Mc                  0  DEVANAGARI VOWEL SIGN AA
`U+0928 <https://codepoints.net/U+0928>`_  '\\u0928'  Lo                  1  DEVANAGARI LETTER NA
`U+0935 <https://codepoints.net/U+0935>`_  '\\u0935'  Lo                  1  DEVANAGARI LETTER VA
=========================================  =========  ==========  =========  ========================

- python `wcwidth.wcswidth()`_ measures width 3, while ConsoleZ_ measures width 4.

And another, of the Vietnamese language, from Microsoft's `Terminal.exe`_, where
`U+0300 <https://codepoints.net/U+0300>`_ "Combining Grave Accent" of the 'Mn'
Category is incorrectly measured as Narrow:

=========================================  =========  ==========  =========  ======================
Codepoint                                  Python     Category      wcwidth  Name
=========================================  =========  ==========  =========  ======================
`U+0074 <https://codepoints.net/U+0074>`_  't'        Ll                  1  LATIN SMALL LETTER T
`U+006F <https://codepoints.net/U+006F>`_  'o'        Ll                  1  LATIN SMALL LETTER O
`U+0061 <https://codepoints.net/U+0061>`_  'a'        Ll                  1  LATIN SMALL LETTER A
`U+0300 <https://codepoints.net/U+0300>`_  '\\u0300'  Mn                  0  COMBINING GRAVE ACCENT
`U+006E <https://codepoints.net/U+006E>`_  'n'        Ll                  1  LATIN SMALL LETTER N
=========================================  =========  ==========  =========  ======================

- python `wcwidth.wcswidth()`_ measures width 4, while Microsoft's
  `Terminal.exe`_ measures width 5.

It is understandable that these category codes are not considered for Zero-Width
support by so many other wcwidth and terminal developers. Unicode.org documents
make only general statements about the purpose of these categories and they do
not make any direct statements about Terminal Emulators. Developers must then
seek for answers among thousands of pages of documents that can be cryptic and
verbose.  Without a search engine and a "hunch", it would be very difficult to
discover naturally!

From Standard `Annex #24`_ Unicode Script Property::

> Implementations that determine the boundaries
> between characters of given scripts should never
> break between a combining mark (a character with
> General_Category value of Mc, Mn or Me) 

And, from Unicode Standard `Annex #14`_ Unicode Line Breaking Algorithm::

> The CM line break class includes all combining
> characters with General_Category Mc, Me, and Mn,
> unless listed explicitly elsewhere. This includes
> viramas that don’t have line break class VI or VF.

Variation Selector-16
=====================

`U+FE0F`_ "Variation Selector-16" is peculiar.

I suspect it is some kind of "fixup" or compatibility sequence for the earliest
emojis. These emojis may be displayed in either "text" or "emoji" style, and
default to "text" style. In "text" style, emojis should appear without color in
a single cell (Narrow), while in "emoji" style, they should display in color and
occupy two cells (Wide).

Despite this distinction, very few fonts effectively differentiate between the two
styles, often rendering both types in color. When not in sequence with `U+FE0F`_
"Variation Selector-16", they are occluded by any next character.

For example, `U+23F1 <https://codepoints.net/U+23F1>`_ "Stopwatch":

.. image:: /images/iterm2-stopwatch-without-vs16.png

Depicted here in iTerm2_ is a single  `U+23F1 <https://codepoints.net/U+23F1>`_
"Stopwatch" character partially occluded by any next character. Surprisingly,
this is the correct behavior of a terminal when `U+FE0F`_ "Variation
Selector-16" is not in sequence.

From python wcwidth Specification_ on Wide characters::

> Any character in sequence with `U+FE0F`_
> (Variation Selector 16) defined by Emoji
> Variation Sequences txt as ``emoji style``.

A list of such characters is found in `emoji-variation-sequence.txt`_.

VS-16 Results
-------------

Out of the 23 terminals subjected to testing, only 7 demonstrated correct behavior by
displaying these emojis as "Wide" characters when combined with VS-16 in sequence.

Remarkably, I found scarce documentation, if any, about VS-16 and its effects in
terminals.  The absence of documentation on this matter was the primary motivation
for writing this article.

Wezterm_, for example, excels in complying with all other Unicode specifications
outlined in this article and tested by ucs-detect_. However, like 16 other
terminals tested, it falls short in supporting VS-16. These emojis are
consistently occluded by the next character, even when in sequence with VS-16.

.. image:: /images/wezterm-vs16.png

Depicted here in Wezterm_ is `U+23F1 <https://codepoints.net/U+23F1>`_
"Stopwatch" followed in sequence by `U+FE0F`_ "Variation Selector-16". However,
the stopwatch is displayed as Narrow, partially occluded by any next character.

Emoji ZWJ
=========

`U+200D`_ "Zero Width Joiner" is a special character facilitating the reduction
of multiple emojis into a single representation that embodies their combination.
This feature resembles a special case of combining_, but it is encoded in a
completely different manner.

The python wcwidth Specification_ on "Width of 0" reads::

> Any character following a ZWJ (U+200D) when
> in sequence by function wcwidth.wcswidth().

An instance of a terminal lacking ZWJ support is Kovid Goyal’s kitty_. It's
important to note that this terminal should not be confused with KiTTY, another
terminal emulator sharing a similar name but predating it by 14 years.
Mr. Goyal expresses `particular hostility
<https://github.com/kovidgoyal/kitty/issues/9#issuecomment-418566309>`_ about
this naming conflict.

=================================================  =============  ==========  =========  ======================
Codepoint                                          Python         Category      wcwidth  Name
=================================================  =============  ==========  =========  ======================
`U+0001F9D1 <https://codepoints.net/U+0001F9D1>`_  '\\U0001f9d1'  So                  2  ADULT
`U+200D`_                                          '\\u200d'      Cf                  0  ZERO WIDTH JOINER
`U+0001F9BC <https://codepoints.net/U+0001F9BC>`_  '\\U0001f9bc'  So                  2  MOTORIZED WHEELCHAIR
`U+200D`_                                          '\\u200d'      Cf                  0  ZERO WIDTH JOINER
`U+27A1 <https://codepoints.net/U+27A1>`_          '\\u27a1'      So                  1  BLACK RIGHTWARDS ARROW
`U+FE0F`_                                          '\\ufe0f'      Mn                  0  VARIATION SELECTOR-16
=================================================  =============  ==========  =========  ======================

- python `wcwidth.wcswidth()`_ measures width 2, while Kovid Goyal's kitty_
  measures width 6.

.. image:: /images/kitty-zwj.png

In this kitty_ example, the depicted sequence is expected to measure a width of 2.
However, kitty_ measures it as 6 because it does not interpret the Zero Width
Joiner character to reduce the three wide characters into one.

Concluding remarks
==================

I intend to use this article as a reference when filing bug reports in open
source projects. I hope you appreciate the effort invested in writing a clear
Specification_ within the python wcwidth_ library and the ucs-detect_ tool,
systematically testing terminals for compliance with the specification.

Additionally, it is worth nothing that the python wcwidth_ project
systematically generates code lookup tables for Wide, Zero-Width, and VS-16
sequences. These tables are created using `update-tables.py`_, which fetches
the latest data from unicode.org. The project utilizes jinja2 templates to
transform that data into Python code.

This can be easily extended for languages like C/C++, Rust, Ruby, Go, or any
other.  Feel free to contribute new code templates to wcwidth_ project for
seamless integration with your preferred language.

Finally, I strongly advocate for Python to internally implement some version of
wcwidth_. Functions like `str.ljust()`_, `textwrap.wrap()`_, or format strings
such as ``f'{my_string:<{width}}'`` should inherently account for the width of
non-ascii characters when formatting strings.  Presently, these functions rely
solely on the **count** of characters without understanding their printed width.
I believe this adversely affects many developers who discover 'the hard way'
that an external library is necessary.  Given that wcwidth_ is downloaded over
50 million times per month, incorporating this functionality into Python should
be a sound and economically sensible decision.

I've discovered a Draft standard for C++, P1868R0_ that proposes adding this
support, and I wholeheartedly endorse this direction. While I'm unsure of its
acceptance, I'm inclined to submit a similar proposal for the Python language
(`Issue #94`_). Equipped with a concise Specification_, I encourage fellow
developers to embark on similar initiatives for all modern programming
languages.

.. _`wcwidth.c`: https://www.cl.cam.ac.uk/~mgk25/ucs/wcwidth.c
.. _`wcwidth-browser.py`: https://github.com/jquast/wcwidth/blob/master/bin/wcwidth-browser.py
.. _wcwidth: https://github.com/jquast/wcwidth
.. _combining: https://en.wikipedia.org/wiki/Combining_character
.. _`published results`: https://ucs-detect.readthedocs.io/results.html
.. _`xterm.js`: http://xtermjs.org/
.. _Hyper: https://ucs-detect.readthedocs.io/sw_results/Hyper.html
.. _`Visual Studio Code`: https://ucs-detect.readthedocs.io/sw_results/VisualStudioCode.html
.. _UDHR: https://unicode.org/udhr/index.html
.. _iTerm2: https://ucs-detect.readthedocs.io/sw_results/iTerm2.html
.. _`Terminal.exe`: https://ucs-detect.readthedocs.io/sw_results/Terminalexe.html
.. _zoc: https://ucs-detect.readthedocs.io/sw_results/zoc.html
.. _ConsoleZ: https://ucs-detect.readthedocs.io/sw_results/ConsoleZ.html
.. _ExtraTermQt: https://ucs-detect.readthedocs.io/sw_results/ExtratermQt.html
.. _`emoji-variation-sequence.txt`: https://unicode.org/Public/15.1.0/ucd/emoji/emoji-variation-sequences.txt
.. _Wezterm: https://ucs-detect.readthedocs.io/sw_results/WezTerm.html
.. _`Annex #14`: https://www.unicode.org/reports/tr14/#DescriptionOfProperties
.. _`Annex #24`: https://www.unicode.org/reports/tr24/#Nonspacing_Marks
.. _`update-tables.py`: https://github.com/jquast/wcwidth/blob/master/bin/update-tables.py
.. _`str.ljust()`: https://docs.python.org/3/library/stdtypes.html#str.ljust
.. _`textwrap.wrap()`: https://docs.python.org/3/library/textwrap.html#textwrap.wrap
.. _`P1868R0`: https://www.open-std.org/jtc1/sc22/wg21/docs/papers/2019/p1868r0.html
.. _`Issue #94`: https://github.com/jquast/wcwidth/issues/94
.. _`Specification`: https://wcwidth.readthedocs.io/en/latest/specs.html
.. _`kitty`: https://ucs-detect.readthedocs.io/sw_results/KovidGoyalskitty.html
.. _`ucs-detect`: https://github.com/jquast/ucs-detect
.. _`cmd.exe`: https://ucs-detect.readthedocs.io/sw_results/cmdexe.html
.. _`wcwidth.wcswidth()`: https://wcwidth.readthedocs.io/en/latest/api.html#wcwidth.wcswidth
.. _Konsole: https://ucs-detect.readthedocs.io/sw_results/Konsole.html
.. _`U+093e`: https://codepoints.net/U+093e
.. _`U+FE0F`: https://codepoints.net/U+FE0F
.. _`U+200D`: https://codepoints.net/U+200D
.. _Fullwidth: https://en.wikipedia.org/wiki/Halfwidth_and_fullwidth_forms#In_Unicode
