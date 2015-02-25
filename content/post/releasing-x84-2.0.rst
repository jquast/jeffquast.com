---
Categories:
    - Python
Description: Releasing x/84 v2.0
Tags:
    - Development
    - x/84
    - telnet
    - ssh
    - bbs
date: 2015-01-25T00:00:00-00:00
menu: main
title: Releasing x/84 v2.0
---


It's been a long year of contributions to my Open Source project, `x/84`_,
with well over 1,000 commits since last release.  What is it? From the
documentation_::

        The primary purpose of x/84 is to provide a server framework for building
        environments that emulate the feeling of an era that predates the world wide
        web.  It may be used for developing a classic bulletin board system (BBS)
        – one is provided as the ‘default’ scripting layer. It may also be used to
        develop a MUD, a text-based game, or a game-hosting server such as done by
        dgamelaunch.

If you know about the other BBS Software systems out there, it might be
good to take a look at the section on `how x/84 compares`_.

A quick "what's new", with contributing authors:

- haliphax: sftp file server and file browser
- haliphax: https web server
- haliphax: intra-bbs messaging through JSON REST api
- haliphax: improved irc client
- hellbeard: ami/x-style artwork
- hellbeard: voting booth
- maze: improved encodings support
- ssh support
- split screen chat
- hacker news reader
- xmodem support
- shroo.ms api for oneliners
- improved profile editor
- all new message area/reader

Along the way, I made many contributions to various projects, such as
paramiko_, prospector_, xmodem_, pylint_ and astroid_ and many others.

Quite frankly I'm exhausted.  This project is over 10 years and 25,000 lines
of code.  Two contributing authors have **learned** python to contribute,
which is quite exciting considering I too learned python to make `x/84`_
(and python has favored me well as a job career!).

Would `x/84`_ look different if I started it afresh?  Certainly it would, there
are certain areas that I cut corners on, that looking back, would have been
better to do correctly from the beginning.  I've enough experience in
software programming to know when a project is too far along to make a
re-write worthwhile.  Let's not forget this is all volunteer work, done for
fun and discovery of the python language, network protocols, and terminal
programming.  Certainly some of the best concepts have been applied to
those employers who pay me, as well as lessons of the worst.  It's ok not
to be perfect, however, it can be disheartening to see people frustrated
by design decisions that I knew could have been done better.

Will `x/84`_ look different in the future?  Not by much, I consider it mostly
complete.  It's up to the community to fork and make their own creative
systems from `x/84`_.  Certainly bugfixes or well-polished features are always
accepted -- Milestone have been etched out as github issues_, whether they
ever get completed is really up to contributing authors to help.

I'm afraid I must move on to more important projects -- of all of my projects,
though `x/84`_ is the largest and the one in development for the longest, it is
also the least downloaded.  For example, pexpect_ receives over 50,000 monthly
downloads, whereas `x/84`_ receives less than 100 !  So its quite clear where my
volunteer time is most beneficial.  However I have an irc channel with a dozen
or so people who are interested in seeing `x/84`_ progress onward -- there is
no such enthusiasm for pexpect_ or any other project.  It's amazing what a
little community interest can do for a developer.  I'll continue to support
these folks as free time allows, and I hope to share maintainership with many
of them, reducing the "bus factor".

I have a list of related contributions and bugfixes to make upstream in the
short-term:

- merging blessed_ project back into blessings_ (namely, keyboard support)
- catching up with the next release of pexpect_
- fixing the implicit string promotion of sqlitedict_
- improve pyflakes options support for prospector_
- add Y-Modem support and create a new API for the xmodem_ library
- ansi.sys emulation support for blessed_, which would make x/84 windows-compatible
- improve telnetlib3_ to make use of coroutines for its state machines
- more detailed ValueError exceptions in cryptography_

In the long term, I'm evaluating new languages such as Apple's swift.  And
of course, there's the $JOB that has me recently diving into things like
OpenStack, salt, and flask -- all heavily python-based.  I don't really see
myself ever leaving python in the way I've permanently fled from ruby, perl,
C++, pascal, or tcl.  But as always, one must evolve or die.

.. _documentation:
.. _x/84: https://github.com/jquast/x84
.. _paramiko: https://github.com/paramiko/paramiko/
.. _prospector: https://github.com/landscapeio/prospector
.. _xmodem: https://github.com/tehmaze/xmodem
.. _pylint: https://pypi.python.org/pypi/pylint
.. _astroid: https://pypi.python.org/pypi/astroid/
.. _how x/84 compares: http://x84.readthedocs.org/en/latest/project_details.html#how-x-84-compares
.. _blessed: https://github.com/jquast/blessed
.. _blessings: https://github.com/erikrose/blessings
.. _pexpect: https://github.com/pexpect/pexpect
.. _sqlitedict: https://github.com/piskvorky/sqlitedict
.. _telnetlib3: https://github.com/jquast/telnetlib3
.. _cryptography: https://github.com/pyca/cryptography/
.. _issues: https://github.com/jquast/x84/issues
