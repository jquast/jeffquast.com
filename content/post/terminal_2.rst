---
Categories:
    - Python
Tags:
    - Development
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

In this article we will examine how the magic string ``\x1b[0;35m`` may be
constructed with determinism, and view the source code of `xterm(1)`_ to
view how it is interpreted.  Finally, we will look at a class of sequences
parsed by `xterm(1)`_ that elicit a response from your terminal emulator
and how this may be used in espionage.

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

Although you are welcome to print raw strings directly to the user's terminal,
as often recommended by introductory guides, for professional software, using
the `terminfo(5)`_ database ensures the correct sequences for the user's
given terminal ``TERM`` environment value are used, and allows the operating
system packaging to maintain terminal support independently of your software.

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

Most modern terminal emulators export environment value ``TERM=xterm``, even
though their parser is not fully compatible.  One thing is clear, however,
the behavior and code for `xterm(1)`_ is the most principal.

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

We can see a fall-through switch statement for the numeric parameter 31
through 37 and setting the foreground color.  Similar code
can be found in Microsoft's `upcoming win32 OpenSSH client 
<https://github.com/PowerShell/Win32-OpenSSH/blob/e743b54a61a272fc403ff288f98150ddd2065838/contrib/win32/win32compat/ansiprsr.c#L438>`_.

Interesting and Strange
-----------------------

Now that we've clearly defined the markup language and its acting parser, we
have time to discover some interesting sequences we may not have seen before.
Some strings, such as the DEC tube alignment test, have no capability name
in the `terminfo(5)`_ database.  In such cases, it is necessary to print
these sequences directly.  DEC tube alignment test causes the screen to
**fill**, a sort of inverse clear screen::

    print('\x1b#8')

We also find ways to manipulate our **character set**, making our output text
incomprehensible -- put this in your co-worker's ``.profile`` for a holiday
prank::

    printf "\x1b(0\x1b)B"

Which reads, "Designate G0 Character Set as DEC Special Character and Line
Drawing, Designate G1 Character Set as US-ASCII".  You may have noticed a
similar problem accidentally outputting a binary file directly to the
terminal, and used `reset(1)`_ to resolve it, which is little more than
a wrapper to::

        printf "\x1bc"

There are several more interesting sequences, the blessed_ library provides
access to many of these state-changing sequences using context managers:

`hidden_cursor <http://blessed.readthedocs.org/en/latest/api.html#blessed.terminal.Terminal.hidden_cursor>`_

   Context manager that hides the cursor, setting visibility on exit.

`location <http://blessed.readthedocs.org/en/latest/api.html#blessed.terminal.Terminal.location>`_

   Context manager for temporarily moving the cursor.

`fullscreen <http://blessed.readthedocs.org/en/latest/api.html#blessed.terminal.Terminal.fullscreen>`_

   Context manager that switches to secondary screen, restoring on exit.

`keypad <http://blessed.readthedocs.org/en/latest/api.html#blessed.terminal.Terminal.keypad>`_

   Context manager that enables directional keypad input.

The reader is encouraged to investigate the source code of their preferred
terminal emulator and try some of the more interesting capabilities found
there.

Reactor
=======

Applications may write hidden messages that change the state of your terminal,
but they may also request your terminal emulator to write hidden messages in
return!

Let's try one, *Report Cursor Position*::

   $ printf "\x1b[6n"; read input
   $ set | grep ^input
   input=$'\E[38;1R'

This is a feature of the blessed_ library::

    import blessed 
    term = blessed.Terminal()

    print(term.get_location())

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
.. _Color Bash Prompt:
.. _xterm(1): 
