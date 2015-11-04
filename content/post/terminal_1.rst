---
Categories:
    - Python
Tags:
    - Development
    - Python
    - Terminal
    - xterm
    - curses
    - ansi
date: 2015-10-27T00:00:00-00:00
menu: main
title: Automation, Terminal Programming with Python series 1
---

Introduction
============

Anything providing an interactive command-line interface may be automated.
 
This article will demonstrate the use of pseudo-terminals which causes programs
to believe they are attached to a terminal, even when they are not!  At first,
executing programs **as though they are attached to a terminal, even if they
are not** might not seem like a useful programming technique, but is in fact
used in a wide variety of software solutions.

The case of color ls(1)
-----------------------

The command ``ls -G`` displays files with colors on OSX and FreeBSD only
when *stdin* is attached to a terminal::

When using the subprocess_ module, we will not see any of these qualities::

        import subprocess
        print(subprocess.check_output(['ls', '-G', '/dev']))

This quick example shows that programs behave differently when attached to a
terminal.

Interactive
-----------

Furthermore, some programs are interactive when attached to a terminal.  The
python executable is an example of this: if we run python directly from a
terminal, we receive an **interactive** REPL_::

        $ python
        Python 3.5.0 (default, Oct 28 2015, 21:00:27)
        [GCC 4.2.1 Compatible Apple LLVM 7.0.0 (clang-700.1.76)] on darwin
        Type "help", "copyright", "credits" or "license" for more information.
        >>> print(4+4)
        8
        >>> exit()

If we run these commands as part of a script, however, it will not display
these decorators.  From bash::

        $ printf 'print(2+2)\nexit()' | python
        4

From Python, using subprocess::

        import subprocess, sys
        python = subprocess.Popen(
            sys.executable, stdin=subprocess.PIPE,
            stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        print(python.communicate(input=b"print(2+2)\nexit()"))

        (b'4\n', b'')

Only a terminal can provide input at any indeterminate future time, and a
terminal is considered connected when standard input tests true for function
`isatty(3)`_.

Try this command with and without shell input redirection::

        $ python -c 'import sys,os;print(os.isatty(sys.stdin.fileno()))'
        True
        $ echo|python -c 'import sys,os;print(os.isatty(sys.stdin.fileno()))'
        False

Cheating isatty(3)
------------------

The remainder of this article will focus on tricking `isatty(3)` into returning
``True`` even if standard in is not actually terminal.  This peculiar behavior
begins by a call to the standard python pty.fork_ function.  This behaves
exactly as os.fork_, except that a pseudo terminal (`pty(4)`_) is wedged
between the child and parent process.

Why is this useful? Let's example several interesting programs that make use
of `pty(3)`_ and `fork(3)`_:

- `tmux(1)`_, `screen(1)`_, and `detach(1)`_ all make use `pty(4)`_ to
  perform their magic: the real terminal may leave (detach), while the
  child continues to believe it is connected with a terminal.

- `script(1)`_ records interactive sessions, ensuring all terminal
  sequences are written to file ``typescript`` for analysis.

- `ttyrec(1)`_ records sessions like `script(1)`_, but with timing information.
  This is the driving technology behind https://asciinema.org/ for example.

- IPython_ notebook executes programs through a `pty(4)`_ for color output.

- `Travis CI`_ use a `pty(4)`_ so test runners produce colorized output.

Finally, the traditional Unix `expect(1)`_ by `Don Libes`_ uses a `pty(4)`_
to allow "programmed dialogue with interactive programs". The remainder
of this article will use pexpect_: a variant of `epxect(1)`_ authored by
`Noah Spurrier`_

The rainmaker
=============

The telnet host ``rainmaker.wunderground.com`` offers weather reports and other
various data by major U.S. Airport codes.  We can use `telnet(1)`_ and
summarize our session as follows:

- send return
- send ``sjc`` (airport cord) and return
- send return
- send ``X`` and return

We could script this **only** with timed input: we must provide sufficient
time for the appearance of each prompt::

        (sleep 2
         echo
         sleep 1
         echo sjc
         sleep 1
         echo
         sleep 1
         echo X
        ) | telnet rainmaker.wunderground.com

By using pexpect_ to wait until a prompt before sending our input, we see a
markable improvement in efficiency, our script would then read as follows::

        import pexpect

        def main(airport_code):
            output = ''
            telnet = pexpect.spawn('telnet rainmaker.wunderground.com',
                                   encoding='latin1', timeout=4)
            telnet.expect('Press Return to continue:')
            telnet.sendline('')
            telnet.expect('enter 3 letter forecast city code')
            telnet.sendline(airport_code)
            while telnet.expect(['X to exit:', 'Press Return for menu:',
                                 'Selection:']) != 2:
                output += telnet.before
                telnet.sendline('')
            output += telnet.before
            telnet.sendline('X')
            telnet.expect(pexpect.EOF)
            telnet.close()
            print(output.strip())

        if __name__ == '__main__':
            import sys
            main(airport_code=sys.argv[1])
