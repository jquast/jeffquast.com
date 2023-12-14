---
Categories:
    - Python
Description: Terminal Emulators Battle Royale – Unicode Edition!
Tags:
    - Python
    - Unicode
    - zero-width
    - full-width
    - wcwidth
    - UNICODE_VERSION
date: 2023-11-13T00:00:00Z
menu: main
title: Terminal Emulators Battle Royale – Unicode Edition!
---

It turns out that Unicode support in Terminals is a lot more difficult than it
first appears. A quick overview of special support for Unicode characters in
Terminals:

- "Wide" characters, especially for languages in the CJK category (Chinese,
  Japanese, and Korean) occupy two cells of a terminal instead of one.

- "Zero" width, mostly for combining_ in languages such as Arabic or Hebrew,
  do not occupy any cells, but instead modify the previous character.

- "Zero Width Joiner" to reduce and combine many codepoints into a single emoji.
  This is something like a special case of combining_, but encoded in a
  completely different way.

- "Varitation Selector-16" is a special character that, for "Narrow"
  characters, causes them to occupy two cells instead of one.

I maintain the python wcwidth_ library, which determines the printable width of
a string when displayed to a terminal and handles all such factors.  This year,
I fixed several bugs by adding support for VS-16 and making corrections in
to the tables considered zero-width.

I also published a formal Specification_ of how characters should be measured.

Then, I published an update to the ucs-detect_ tool to systematically test
terminal emulators for their compliance to the specification.

Finally, I have `published results`_ of those tests for the most popular
terminal emulators on Linux, macOS, and Windows.  This article is a summary of
my findings.

Wide Character support
======================

Across all unicode capabilities tested, Wide character support is best. This is
likely due to the introduction of Emojis as Wide Characters that brought about 
interest to people of *all* languages.

All terminals tested support Wide Characters, but at varying versions of
unicode.  Konsole_, iTerm2_, and Kovid Goyle's kitty_ supports wide characters
up to Unicode release version 15.0.0 (2022), while Hyper_ and `Visual Studio
Code`_ support only up to unicode release 12.1.0 (2019), both based on
`xterm.js`_, which has poor support for all unicode specifications tested.

This means that these wide characters take up 1 cell instead of 2, often
occluded by the next character.

.. image:: /images/hyper-wide.png

Here we see several Wide Emoji mistakenly displayed as Narrow by
Hyper_ due to out-of-date code tables in `xterm.js`_.

From the wcwidth project Specification_::

> Any character defined by East Asian Fullwidth (F) or Wide (W) properties in
> EastAsianWidth txt files, except those that are defined by the Category codes
> of Nonspacing Mark (Mn) and Spacing Mark (Mc).

The "except" clarification is needed, as there are several characters officially
categorized as Wide or Fullwidth, but they are secretly Zero width by their category
codes in other files!

::

> Any characters of Modifier Symbol category, 'Sk' where 'FULLWIDTH' is present
> in comment of unicode data file, aprox. 3 characters.

This clause is necessary for a small set of characters from the modifier symbol
Category that are not officially defined as Fullwidth or Wide, but they are!
These characters may only be detected by parsing the **comment** field of the
data files.

The "Modifier Symbol" category is a strange category. It is a set of combining
characters that do not combine, except for the Emoji Modifier Fitzpatrick, which
modifies the skin tone of the previous Emoji, making it a combining character
unlike all other characters of this category.

Unicode.org made many mistakes in categorizing these characters, so it is no
wonder that so many developers who aim to support even the latest unicode
standards can still get a small percentage of them wrong.


Zero Width
==========

Zero Width characters are especially difficult to test. Although it may be
possible in join *some* combining characters with *any* other unicode
characters, such as `U+0309 <https://codepoints.net/U+0309>`_ "Combining Hook
Above" with box drawing character `U+2532 <https://codepoints.net/U+2532>`_::

        ┲̉

This is not true for *most* combining characters, that may only combine with
specific characters.  For example, `U+094D <https://codepoints.net/U+094D>`_
"Devanagari Sign Virama" may combine with an appropriate Devanagari letter, such
as `U+0915 <https://codepoints.net/U+0915>`_ "Devanagari Letter Ka"::

        क्

But fails to combine for non-devanagari letters, such as `U+0061
<https://codepoints.net/U+0061>`_ "Latin Small Letter A"::

        A्

The "dotted donut" depicted is used as a placeholder for such illegal
combinations.
 
.. image:: /images/iterm2-combining-latin.png

Depicted here in iTerm2_ are several combining characters after
`U+0007 <https://codepoints.net/U+0007>`_ "Latin Small Letter O", where many
fail to combine.

The developer tool `wcwidth-browser.py`_ from the wcwidth repository offers to
display combining characters in this naive way by pressing ``'c'`` after launch,
or by CLI argument ``--combining``, but it only serves to demonstrate that naive
combining is not possible for a vast number of characters.

A Rosetta Stone?
----------------

The Universal Declaration of Human Rights (UDHR) is a document that has been
translated into over 500 languages. The UDHR Unicode project provides a
collection of these translations.  This is a great resource for testing
Zero-Width characters, as it contains large number of languages and scripts.

Afterall, outside of Emoji, we really only care about whether any particular
language is supported, and for many languages, zero-width characters are
necessary to properly write them.

Using the ucs-detect_ tool to display phrases from UDHR in each language and
measuring the displayed width, we can more completely test for Zero-Width
character support of a Terminal by each Language.

Zero Width Results
------------------

The Windows-only terminals, `Terminal.exe`_, `cmd.exe`_, and ConsoleZ_,
as well as the cross-platform ExtraTermQt_ and for-pay commercial zoc_
terminal all fail to correctly display many Zero-Width characters, failing
for approximately 100 of the world's languages.

Common among these terminals is that they fail to account for characters of the
category codes Nonspacing Mark (Mn) and Spacing Mark (Mc).

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

- python `wcwidth.wcswidth()`_ measures width 3, while *ConsoleZ* measures width 4.

And another, of the Vietnamese language, from `Terminal.exe`_, where `U+0300
<https://codepoints.net/U+0300>`_ COMBINING GRAVE ACCENT of the 'Mn' Category is
incorrectly measured as Narrow:

=========================================  =========  ==========  =========  ======================
Codepoint                                  Python     Category      wcwidth  Name
=========================================  =========  ==========  =========  ======================
`U+0074 <https://codepoints.net/U+0074>`_  't'        Ll                  1  LATIN SMALL LETTER T
`U+006F <https://codepoints.net/U+006F>`_  'o'        Ll                  1  LATIN SMALL LETTER O
`U+0061 <https://codepoints.net/U+0061>`_  'a'        Ll                  1  LATIN SMALL LETTER A
`U+0300 <https://codepoints.net/U+0300>`_  '\\u0300'  Mn                  0  COMBINING GRAVE ACCENT
`U+006E <https://codepoints.net/U+006E>`_  'n'        Ll                  1  LATIN SMALL LETTER N
=========================================  =========  ==========  =========  ======================

- python `wcwidth.wcswidth()`_ measures width 4, while `Terminal.exe`_ measures width 5.

It is understandable that these category codes are not considered for zero-width
support by so many developers. Unicode.org documents make only general
statements about the purpose of these categories and they do not directly make
statements about Terminal Emulators. Developers must then find such answers
among thousands of pages of documents that can be sometimes cryptic and
othertimes verbose.  Without a search engine and a "hunch", it would be very
difficult to discover naturally.

From Standard Annex #24 Unicode Script Property::

> Implementations that determine the boundaries between characters of given
> scripts should never break between a combining mark (a character with
> General_Category value of Mc, Mn or Me) 

And, from Unicode Standard Annex #14 Unicode Line Breaking Algorithm::

> The CM line break class includes all combining characters with
> General_Category Mc, Me, and Mn, unless listed explicitly elsewhere. This
> includes viramas that don’t have line break class VI or VF.

Variation Selector-16
=====================

`U+FE0F`_ "Variation Selector-16" is peculiar.

I suspect it is some kind of "fixup" or compatibility sequence for the earliest
emojis. These emojis may be displayed in either "text" or "emoji" style, and
default to "text" style. Text style should display without color in a single
cell (Narrow), while "emoji" style should be color and occupy 2 cells (Wide).

Very few fonts differentiate them, displaying both types in color, and,
when not in sequence with `U+FE0F`_ "Variation
Selector-16", they are occluded by any next character.

For example, `U+23F1 <https://codepoints.net/U+23F1>`_ "Stopwatch":

.. image:: /images/iterm2-stopwatch-without-vs16.png

Depicted here in iTerm2_ is a single  `U+23F1 <https://codepoints.net/U+23F1>`_
"Stopwatch" character partially occluded by any next character. Believe it or
not, this is correct behavior of a terminal when `U+FE0F`_ "Variation
Selector-16" is not in sequence.

From python wcwidth Specification_ on Wide characters::

> Any character in sequence with `U+FE0F`_ (Variation Selector 16) defined by
> Emoji Variation Sequences txt as ``emoji style``.

A list of such characters is found in `emoji-variation-sequence.txt`_.

VS-16 Results
-------------

Only 7 of the 23 terminals tested correctly display these Emojis as "Wide"
characters when combined with VS-16 as a sequence. Wezterm_, for example,
complies with all other Unicode specifications outlined in this article except
for this one, and, so like the other 16 terminals tested, these emojis are
always occluded by the next character, even when in sequence with VS-16.

.. image:: /images/wezterm-vs16.png

Depicted here in Wezterm_ is `U+23F1 <https://codepoints.net/U+23F1>`_
"Stopwatch" followed in sequence by `U+FE0F`_ "Variation Selector-16", but the
stopwatch is displayed as Narrow, partially occluded by any next character.

Emoji ZWJ
=========

`U+200D`_ "Zero Width Joiner" is a special character that allows multiple Emojis
to be reduced to a single emoji that represents their combination.

This is something like a special case of combining_, but it is encoded in a
completely different way.

The python wcwidth Specification_ on "Width of 0" reads::

> Any character following a ZWJ (`U+200D`_) when in sequence by function
> wcwidth.wcswidth().

One such example from Kovid Goyle’s kitty_ (which I cannot mention without also
clarifying that it is **not to be confused with KiTTY**, another terminal
emulator of the same name that predates it by 14 years.  Mr. Goyle appears
`particularly hostile
<https://github.com/kovidgoyal/kitty/issues/9#issuecomment-418566309>`_ about
this naming conflict).

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

- python `wcwidth.wcswidth()`_ measures width 2, while Kovid Goyle's kitty_
  measures width 6.

.. image:: /images/kitty-zwj.png

Depicted here in kitty_ is the above sequence, expected to measure as width 2,
but measured by kitty as 6 because it does not interpret the Zero Width Joiner
character to reduce the three wide characters into one.


Concluding remarks
==================

I will be using this article as a reference when filing bug reports in open
source projects, and I hope that you will appreciate the effort that I have made
in writing a clear Specification_ in the python wcwidth library, and the
ucs-detect_ tool to systematically test terminals for their compliance to the
specification.

You might also like to know that the python wcwidth_ project systematically
creates code lookup tables for Wide, Zero-width, and VS-16 sequences, and that
these tables are generated by `update-tables.py`_, fetching the latest data from
unicode.org, and uses jinja2 templating to transform that data into python code.
This could be easily extended for C/C++, Rust, Ruby, Go, or any other language.

Finally, I believe that Python as well as all other modern programming languages
should implement some version of wcwidth_ directly. That `str.ljust()`_,
`textwrap.wrap()`_, or format strings such as ``f'{my_string:<{width}}'`` should
directly perform the accounting necessary to format strings, rather than
requiring a 3rd party library. These functions currently use the **count** of
characters without any understanding of their printed width, and I believe this
is to the detriment of developers who discover "the hard way" that they need to
use an external library.

I have found one such Draft standard for C++, P1868R0_ that proposes to add this
support to C++ and I absolutely support this direction, though I am not certain
whether it was accepted. I would like to submit a similar proposal for the
Python language (`Issue #94`_), and I encourage other developers to make similar
efforts for all modern programming languages. 

.. _`wcwidth.c`: https://www.cl.cam.ac.uk/~mgk25/ucs/wcwidth.c
.. _`wcwidth-browser.py`: https://github.com/jquast/wcwidth/blob/master/bin/wcwidth-browser.py
.. _wcwidth: https://github.com/jquast/wcwidth
.. _combining: https://en.wikipedia.org/wiki/Combining_character
.. _`published results`: https://ucs-detect.readthedocs.io/results.html
.. _`xterm.js`: http://xtermjs.org/
.. _Hyper: https://ucs-detect.readthedocs.io/sw_results/Hyper.html
.. _`Visual Studio Code`: https://ucs-detect.readthedocs.io/sw_results/VisualStudioCode.html
.. _`UDHR in Unicode`: https://unicode.org/udhr/index.html
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
.. _`kitty`: https://ucs-detect.readthedocs.io/sw_results/KovidGoyleskitty.html
.. _`ucs-detect`: https://github.com/jquast/ucs-detect
.. _`cmd.exe`: https://ucs-detect.readthedocs.io/sw_results/cmdexe.html
.. _`wcwidth.wcswidth()`: https://wcwidth.readthedocs.io/en/latest/api.html#wcwidth.wcswidth
.. _Konsole: https://ucs-detect.readthedocs.io/sw_results/Konsole.html
.. _`U+093e`: https://codepoints.net/U+093e
.. _`U+FE0F`: https://codepoints.net/U+FE0F
.. _`U+200D`: https://codepoints.net/U+200D
