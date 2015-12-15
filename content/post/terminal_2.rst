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
that appear something like a markup language for::

    magenta = '\x1b[0;35m'

    print(magenta + 'magenta is an original primary CGA color.')

In this article we will examine how the magic string ``\x1b[0;35m`` may be
constructed with some determinism.  Then, view the source code of `xterm(1)`_
to learn how they are interpreted.  Finally, we will look at a class of
sequences parsed by `xterm(1)`_ that elicit a response from your terminal
emulator.

Capabilities
============

If we review the manual for `terminfo(5)`_::

    $ man 5 terminfo

We discover a database of terminal capabilities that allows us to construct
these special sequence strings.  If we `dig deeper
<http://www.amazon.com/termcap-terminfo-OReilly-Nutshell-Linda/dp/0937175226>`_,
we will find a parameterized language for describing terminal capabilities.

The termcap.src_ file is authored in a special language that helps associate
terminals defined by ``TERM`` environment value to their terminal capability
strings.

With the curses_ module of python, we can access the C library routines that
for the capabilities database defined by `terminfo(5)`_::

        import curses
        curses.setupterm()

        cyan = curses.tparm(curses.tigetstr('setaf'),
                            curses.COLOR_CYAN).decode()

        print(cyan + 'cyan is a primary CGA color.')


The blessed_ library provides a much simpler interface::

        import blessed
        term = blessed.Terminal()

        print(term.red + 'red was not introduced until EGA.')

Although you are welcome to print raw strings directly to the user's terminal,
as often recommended by introductory guides, using the `terminfo(5)`_ database
ensures the correct sequences for the given user's ``TERM`` environment value
are used.  It also allows the Operating System to maintain terminal support
independently of your software.

Rendering
=========

The ASCII control character *ESCAPE* (``\x1b``) begins a detour to a special
processing routine when received by a terminal emulator.  The string phrase
``'\x1b[1;35m'`` is meaningful as a kind of markup language. 

We can read this as a standard polish notation parser: placing arguments onto
the stack, then calling the defining function:

- ``\x1b[`` is the `Control Sequence Inducer`_ (CSI) sequence,
- followed by parameters ``1;31`` (*Bold*, *Magenta*),
- with final function ``m`` for `Select Graphics Rendition`_ (SGR).

xterm
-----

Most modern terminal emulators export environment value ``TERM=xterm``, even
though their parser is not fully compatible. This marks the behavior and code
for `xterm(1)`_ as the most principal and correct.

Within a 2,740-line function, ``doparsing()``, we find the `application of the
color red
<https://github.com/joejulian/xterm/blob/defc6dd5684a12dc8e56cb6973ef973e7a32caa3/charproc.c#L2673-2685>`_::

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

Now that we have clearly defined the markup language and its acting parser, we
have time to discover some interesting sequences we may not have seen before.
Some strings, such as the DEC tube alignment test, have no capability name
in the `terminfo(5)`_ database.  In such cases, it is necessary to print
these sequences directly.

The DEC tube alignment test sequence causes the screen to **fill**,
a sort of inverse clear screen::

    print('\x1b#8')

We also find ways to manipulate our **character set**, making our output text
incomprehensible -- put this in your co-worker's ``.profile`` for a holiday
laugh::

    printf "\x1b(0\x1b)B"

Which reads,

- Designate G0 Character Set as DEC Special Character and Line Drawing,
- Designate G1 Character Set as US-ASCII.

You may have noticed a similar problem occurs as a byproduct when
accidentally outputting a binary file directly to the terminal. The
`reset(1)`_ command may be executed to reset your terminal.  Or, you
may simply emit the sequence, ``ESC c`` to correct your terminal::

        printf "\x1bc"

There are several more interesting sequences, the blessed_ library provides
access to many of the common state-changing sequences as context managers:

- `hidden_cursor <http://blessed.readthedocs.org/en/latest/api.html#blessed.terminal.Terminal.hidden_cursor>`_: hides cursor, restoring visibility on exit.

- `location <http://blessed.readthedocs.org/en/latest/api.html#blessed.terminal.Terminal.location>`_: Temporarily move the cursor, restoring original position on exit.

- `fullscreen <http://blessed.readthedocs.org/en/latest/api.html#blessed.terminal.Terminal.fullscreen>`_: Switch to secondary screen, restoring primary screen on exit.

- `keypad <http://blessed.readthedocs.org/en/latest/api.html#blessed.terminal.Terminal.keypad>`_: Enable directional keypad input.

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

There are other sequences that cause a terminal emulator to write a response,
some terminals respond to the raw control character, *^E* (``\x05``) with
a terminal identifier, such as PuTTY_.

Espionage
---------

We can elicit responses of a variety of details about the client through this
in-band control channel, and we can temporarily disable echo to ensure it is
hidden and collected without the user's knowledge.

Combined with the protocol such as ssh or telnet, we can produce a fingerprint
and guess of the client's operating system with a very high confidence value.

Furthermore, we can deduce the round trip time to the distant end's
emulator, allowing us to estimate actual time of transmission and receipt
of I/O, an important factor in providing responsive interfaces.

whatis.telnet.org
=================

An upcoming project will be an interactive, fingerprinting telnet server.  It
will produce a private report of all of the details it was able to retrieve,
and hosted at telnet address ``whatis.telnet.org``.

.. _termcap.src: http://invisible-island.net/ncurses/terminfo.src.html#tic-xterm-basic
.. _Control Sequence Inducer: http://invisible-island.net/xterm/ctlseqs/ctlseqs.html#h2-Functions-using-CSI-_-ordered-by-the-final-character_s_
.. _Select Graphics Rendition: http://www.vt100.net/docs/vt510-rm/SGR
.. _Color Bash Prompt: https://wiki.archlinux.org/index.php/Color_Bash_Prompt
.. _xterm(1): http://invisible-island.net/xterm/
.. _terminfo(5): http://www.openbsd.org/cgi-bin/man.cgi/OpenBSD-current/man5/terminfo.5
.. _reset(1): http://www.openbsd.org/cgi-bin/man.cgi/OpenBSD-current/man1/reset.1
.. _PuTTY: http://www.chiark.greenend.org.uk/~sgtatham/putty/
.. _curses: https://docs.python.org/3.3/howto/curses.html
.. _blessed: https://pypi.python.org/pypi/blessed/
