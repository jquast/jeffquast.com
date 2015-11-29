---
Categories:
    - Python
Tags:
    - Development
    - Automation
    - Terminal
    - sequence
    - parsing
    - termcap
    - curses
    - xterm
    - color
    - ansi

date: 2015-11-28T00:00:00-00:00
menu: main
title: Terminal Output Sequences
---

Terminal Programming with Python series 2: Terminal Output Sequences

Introduction
============

A student new to Systems Programming will eventually stumble upon a strange
method for printing color in a terminal.  They might see something like the
Arch Linux `Color Bash Prompt`_ guide, introducing a table of shell variables
that, when printed to the screen, creates something like a markup language for
changing text color::

    magenta = '\x1b[0;35m'
    print(magenta + 'magenta is a primary CGA color.')

In this article we will examine how the string ``\x1b[0;35m`` may be
constructed and view the source code of `xterm(1)`_ to discover where it is
interpreted.  This allows us to discover an interesting new set of special
strings parsed by `xterm(1)`_: **sequences that elicit a response**.

Capabilities
============

If we review the manual for `terminfo(5)`_::

    $ man 5 terminfo


We'll discover a database of terminal capabilities that allows us to construct
these special sequence strings.  If we `dig deeper
<http://www.amazon.com/termcap-terminfo-OReilly-Nutshell-Linda/dp/0937175226>`_,
we will find a parameterized language for describing terminal capabilities and
the termcap.src_ file authored in it.  With the curses_ module of python, we
can access the C library routines that parse this capabilities database::

        import curses
        curses.setupterm()

        cyan = curses.tparm(curses.tigetstr('setaf'),
                            curses.COLOR_CYAN).decode()

        print(cyan + 'cyan is a primary CGA color.')


The blessed_ library provides a much simpler interface::

        import blessed
        term = blessed.Terminal()

        print(term.red('red did not appear until EGA.'))

Rendering
=========

The control character *Escape* ``\x1b`` has special meaning when received by
an emulator, entering a special processing state of the parser.

As you may have guessed, the string phrase ``'\x1b[0;35m'`` is meaningful as a
kind of markup language.  We can read this as a standard polish notation
parser: placing arguments onto the stack, then calling defining the function.

``\x1b[`` is the `Control Sequence Inducer`_ (CSI) sequence, followed by
parameters ``1;31`` with final function ``m`` for `Select Graphics Rendition`_
(SGR).  This in turn sets the foreground color to *Magenta*.

xterm
-----

Most modern terminal emulators claim ``xterm`` as their ``TERM`` environment
value.  So let us examine the source code of xterm_ to discover where these
special sequences are parsed.

Within a 2,740-line function, ``doparsing()``, we find the `application of the
color red <https://github.com/joejulian/xterm/blob/defc6dd5684a12dc8e56cb6973ef973e7a32caa3/charproc.c#L2673-2685>`_::

     2673                 case 31:
     (...)
     2679                 case 37:
     2680                     if_OPT_ISO_COLORS(screen, {
     2681                         xw->sgr_foreground = (op - 30);
     2682                         xw->sgr_extended = False;
     2683                         setExtendedFG(xw);
     2684                     });
     3685                     break;

So we can see here very rudimentary token parser that sets the foreground
color when the second parameter is valued ``31`` through ``37``.

Interesting and Strange
-----------------------

Now that we've clearly defined the markup language and its acting parser, we
have time to discover some interesting sequences we may not have seen before,
such as ``\x1b#8``, the DEC tube alignment test that causes the screen to
*fill*, a sort of inverse clear screen.

We also find ways to manipulate our **character set**, making our output text
incomprehensible -- put this in your co-worker's ``.profile`` for a holiday
prank::

    printf "\x1b(0\x1b)B"

Which reads: ``Designate G0 Character Set`` as ``DEC Special Character and Line
Drawing``.  Then, Designate G1 Character Set as ``US-ASCII``.  You may have
noticed a similar problem accidentally outputting a binary file directly to
the terminal.

Perhaps you learned to fix this by invoking ``reset(1)``, but this is little
more than a wrapper to ``\x1bc``, the instruction that causes the terminal to
perform a full reset.

Changing the title of our terminal, showing or hiding the cursor and its blink
rate, or swapping between an "alternate screen" to allow restoration of the
terminal's original screen state on program exit are among many other
interesting output sequences.

Reactor
=======

Applications may write hidden messages that change the state of your terminal,
but they may also request your terminal emulator to write hidden messages in
return!

Let's try one, *Report Cursor Position*::

   $ printf "\x1b[6n"; read input
   $ set | grep ^input
   input=$'\E[38;1R'

Espionage
---------

One can quickly separate automatic robots from a human using a terminal
emulator by requesting their cursor position.  This is useful for providing
something like a "are you human" test for terminals that are so popular with
html sites to discern the same.

Furthermore, we can deduce the round trip time to the distant end's
emulator, allowing us to estimate actual time of transmission and receipt
of I/O, an important factor in providing responsive interfaces.

We can elicit responses of a variety of details about the client through this
in-band control channel, and we can temporarily disable echo to ensure it is
hidden.  We can learn whether the window is minimized, whether input was
*pasted*, and not keyed in, or detect mouse clicks, like when a user attempts
to copy our output to their clipboard.

.. _termc,ap.src: http://invisible-island.net/ncurses/terminfo.src.html#tic-xterm-basic
.. _Control Sequence Inducer: http://invisible-island.net/xterm/ctlseqs/ctlseqs.html#h2-Functions-using-CSI-_-ordered-by-the-final-character_s_
.. _Select Graphics Rendition:
