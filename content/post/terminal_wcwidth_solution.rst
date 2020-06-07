---
Categories:
    - Python
Description: Proposal for wide character issues in Terminals
Tags:
    - Python
    - Unicode
    - zero-width
    - full-width
    - wcwidth
    - UNICODE_VERSION
date: 2020-06-07T00:01:00-00:00
menu: main
title: Offering a solution for Terminal Wide Character issues
---

Quicktro
========

The printable length of most characters are equal to the number of cells they
occupy on the screen, ``1 character : 1 cell``. However, there are categories of
characters that occupy **2 cells** (full-width_), and others that occupy **0
cells** (zero-width_).

All popular terminals support displaying full and zero-width Unicode characters
correctly. For CLI applications and their libraries, such as
IPython_ and the python-prompt-toolkit_, it is just a matter of calling into the
wcwidth_ library when rendering characters for display, albeit with a `small bit
of care`_ around the occasional `-1` return value.

The Problem
===========

If this is a solved problem, why do we still see so many *misaligned* characters
in Terminal applications?

.. image:: /images/hyper-example.png
   :alt: An example of misaligned wide characters by the Hyper Terminal

At this time of writing, each Unicode version, ``4.1.0``, ``5.1.0``, ``5.2.0``,
``8.0.0``, ``9.0.0``, ``10.0.0``, ``11.0.0``, ``12.0.0``, ``12.1.0``, and
``13.0.0``, have support for more full and zero-width characters than their
previous version. Many more versions are expected to come over the next few
years.

Terminal and library authors **select only one** version of Unicode when they
implement `zero <zero-width>`_ and full-width_ support. Sometimes, the latest
specification is used, but usually not. Most just copy any existing solution
without too much care, and we can't really blame them, it's actually a pretty
difficult decision.

iTerm2_, for example, supports version ``8.0.0`` unless the `checkbox Use
unicode version 9+ widths`_ is enabled (which is ``12.1.0`` at the time of this
post). The choice to use an older version by default is most likely a conscious
design decision to better match the libc wcwidth.c_ version linked by most
CLI's.  Many languages and libraries based in C/C++ continue to conform to
Unicode ``5.0``, the version of Unicode used the last version of wcwidth.c_
released by `Markus Khun`_ in to the public domain 2007. This appears to be
true of the `hyper`_ terminal, displayed in the above figure.

Chinese, Japanese, and Korean users, whose languages use full-width characters
almost exclusively are the most impacted. The Western world only seemed to
notice this problem with the introduction of emoticons in version ``9.0``.

Problem statement
-----------------

The version of Unicode used by Terminals and Libraries will continue to be a
problem, because new versions of the Unicode Standard are issued periodically,
but the source code of libraries and applications are not updated at the same
time, or at all!

The wcwidth.c_ family of libraries in use cannot know what version of Unicode
your terminal supports, and the terminal cannot know what version an application
intends to use.

The Solution
============

In the python wcwidth_ library, I added support for **all versions of Unicode**,
it requires only a matter of selecting the right version, by function argument,
or, by environment variable, ``UNICODE_VERSION``.

But how can we know what version is used?  Well, I do hope other language
implementations of wcwidth_ can follow my example of multi-version and selection
support by the environment ``UNICODE_VERSION``, and that terminal emulators can
export their supported version by environment value. But this is going to take
some time.

And so, I've authored another tool, ucs-detect_, which is able to
**automatically detect the version of unicode** that the connecting Terminal
supports. For any python CLI application using wcwidth_, the correct return
value is selected for any of its dependent libraries and CLI's by using the
given value of the UNICODE_VERSION environment variable.

With this solution, we can correctly determine the ``UNICODE_VERSION`` of hyper_
terminal as ``5.1.0``, and those cells that were previously thought to be
full-width, are now correctly determined to be half-width by the wcwidth_ python
library, and align correctly:

.. image:: /images/hyper-example-fixed.png
   :alt: An example of corrected alignment by Hyper Terminal

Interim
-------

Download and install ucs-detect_, and add to your shell profile::

    eval "$(ucs-detect)"

Take a look at the ucs-detect_ documentation for a more complete description of
the solution, which I would like to see adapted to more shells and dynamic
languages of CLI applications until Terminal emulator authors can be persuaded
to export their value. If you author a library like wcwidth_, please also
consider supporting this proposal for version selection by environment variable.

While I have your attention
============================

If you're reading this, you must have some level of interest in Terminals, so if
you are not aware of the **continued, unrelenting, voluntary** contributions to
the Terminal ecosystem by `Thomas E. Dickey`_, please take a moment to have
a look at his website.

Of particular interest to me, at least, is the documented `trials and
tribulations`_ of developing ncurses_. I like to think that a lot of the
software engineering work we come into contact with each day would have
happened eventually, no matter who did it. But `Thomas E. Dickey`_ is
one of those exemplary folks who have the discipline to solve the smallest and
most difficult problems that can add up to the greatest change.  Every engineer
should have at least 1 role model, and Mr. Dickey is one of mine.

And also, I'm no longer with a `$JOB or $HOME`_. **If you are employing, I am
looking**, and willing to relocate (except for maybe SF and NYC).  Please take a
look at my resume_!  I have about 19 years of Python and about 23 years of Linux
experience, I'm pretty OK at those, and a few other things, too.

.. _`small bit of care`: https://github.com/prompt-toolkit/python-prompt-toolkit/blob/ff0548487a644e722943f9685666c3963311c17f/prompt_toolkit/utils.py#L136-L144
.. _wcwidth: https://github.com/jquast/wcwidth
.. _python-prompt-toolkit: https://github.com/prompt-toolkit/python-prompt-toolkit/blob/master/PROJECTS.rst#projects-using-prompt_toolkit
.. _wcwidth.c: https://www.cl.cam.ac.uk/~mgk25/ucs/wcwidth.c
.. _zero-width: https://en.wikipedia.org/wiki/Zero-width_joiner
.. _full-width: https://en.wikipedia.org/wiki/Halfwidth_and_fullwidth_forms
.. _`Thomas E. Dickey`: https://invisible-island.net/
.. _ncurses: https://invisible-island.net/ncurses/ncurses.html
.. _`trials and tribulations`: https://invisible-island.net/ncurses/ncurses-license.html
.. _ucs-detect: https://github.com/jquast/ucs-detect/
.. _`Markus Khun`: https://en.wikipedia.org/wiki/Markus_Kuhn_(computer_scientist)
.. _IPython: https://ipython.org/
.. _resume: https://jeffquast.com/resume-jquast.pdf
.. _`$JOB or $HOME`: /post/without_a_job_or_home/
.. _hyper: https://github.com/vercel/hyper
.. _iTerm2: https://www.iterm2.com
.. _`checkbox Use unicode version 9+ widths`: https://www.iterm2.com/documentation-preferences-profiles-text.html
