---
Categories:
    - Python
Tags:
    - Development
    - Automation
    - Terminal
    - pexpect
    - Python
    - isatty
    - pty

date: 2015-10-27T00:00:00-00:00
menu: main
title: Automation and pty(4)
---

Terminal Programming with Python series 1: Automation and pty(4)

Introduction
============

Any command-line UNIX interface may be automated.
 
This article will demonstrate the use of pseudo-terminals, which cause
programs to believe they are attached to a terminal, even when they are not!

At first, fooling programs into beleiving they are attached to a terminal may
not seem useful, but it is used in a wide variety of software solutions.
This programming technique is indespensible in automation and testing fields.

The case of color ls(1)
-----------------------

The command ``ls -G`` displays files with colors on OSX and FreeBSD **only
when *stdin* is attached to a terminal**.  When using the subprocess_ module,
we will not see any of these qualities::

        import subprocess
        print(subprocess.check_output(['ls', '-G', '/dev']))

This quick example shows that programs behave differently when attached to a
terminal.

Interactive
-----------

Furthermore, some programs are interactive when attached to a terminal.  The
python executable is an example of this.  When we run python directly from a
terminal, we receive an **interactive** REPL_::

        $ python
        Python 3.5.0 (default, Oct 28 2015, 21:00:27)
        [GCC 4.2.1 Compatible Apple LLVM 7.0.0 (clang-700.1.76)] on darwin
        Type "help", "copyright", "credits" or "license" for more information.
        >>> print(4+4)
        8
        >>> exit()

If we run these commands as part of a script, however, it will not display
these decorators demonstrated here using the standard shell::

        $ printf 'print(2+2)\nexit()' | python
        4

And strangely enough, executing Python from Python, using the subprocess_
module demonstrates the same output::

        import subprocess, sys
        python = subprocess.Popen(
            sys.executable, stdin=subprocess.PIPE,
            stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        print(python.communicate(input=b"print(2+2)\nexit()"))

        (b'4\n', b'')

With a keyboard attached, a terminal is expected to provide input at any
non-determinate future time.  Programs such as python tests whether any of the
standard file descriptors (*stdin*, *stdout*, *stderr*) are attached to a
terminal to conditionally branch their behaviour.

We can reproduce this conditional check of `isatty(3)`_ easily from shell::

        $ python -c 'import sys,os;print(os.isatty(sys.stdin.fileno()))'
        True

        $ echo | python -c 'import sys,os;print(os.isatty(sys.stdin.fileno()))'
        False

As *stdin* is piped, this fails the test for `isatty(3)`_ test.

Cheating isatty(3)
------------------

The remainder of this article will focus on tricking `isatty(3)` into returning
``True`` even when the standard descriptors are not actually terminal.  This
peculiar behavior begins by a call to the standard python pty.fork_ function.
This behaves exactly as os.fork_, except that a pseudo terminal (`pty(4)`_) is
wedged between the child and parent process.

Why is this useful? Let's examine some programs that make use of `pty(4)`_
and `fork(2)`_ to explain for themselves:

- `tmux(1)`_ and `screen(1)`_ make use of `pty(4)`_ to perform their magic:
  the real terminal may leave (detach), while the child continues to
  believe it is connected with a terminal.

- `script(1)`_ records interactive sessions, ensuring all terminal
  sequences are written to file ``typescript`` for analysis.

- `ttyrec(1)`_ records sessions like `script(1)`_, but with timing information.
  This is the driving technology behind https://asciinema.org/ for example.

- IPython_ notebook executes programs through a `pty(4)`_ for color output.

- `Travis CI`_ uses a `pty(4)`_ so test runners produce colorized output.

Finally, the traditional Unix `expect(1)`_ by `Don Libes`_ uses a `pty(4)`_
to allow "programmed dialogue with interactive programs". The remainder
of this article will use pexpect_: a variant of `expect(1)`_ authored by
`Noah Spurrier`_

The rainmaker
=============

The telnet host ``rainmaker.wunderground.com`` offers weather reports and other
various data by major U.S. Airport codes.  We can use `telnet(1)`_ and
summarize our session as follows:

- send *return*
- send ``sjc`` (airport code) and return
- send *return*
- send ``X`` and return

Using pipes, we could script this using only timed input: we must provide
sufficient time to elapse for the appearance of each prompt::

        (sleep 2
         echo
         sleep 1
         echo sjc
         sleep 1
         echo
         sleep 1
         echo X
        ) | telnet rainmaker.wunderground.com

By using pexpect_ to wait for a prompt before sending our input, we see a
markable improvement in efficiency and fault tolerance.  Our script would
then read as follows::

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

Closing thoughts
================

A REPL_ is a particularly interesting target.  The SageMath_ project uses
pexpect_ to bundle a great variety of math software by driving the REPL_
interface of a variety of mathematics programs, bypassing the need to link with
software of other programming languages.

Software and language suites providing a shell or REPL may be functionally
tested using pexpect_, and this is where the library serves its purpose best.

In many industries where technology systems migrate slowly, it may become
very useful to automate commercial or blackbox software systems that provide
only a shell, such as mainframes or embedded control devices.  With the
technique of terminal automation, we may now provide a sensible REST API to
such legacy systems!

.. _detach: http://inglorion.net/software/detach/
.. _subprocess: https://docs.python.org/3/library/subprocess.html
.. _REPL: https://en.wikipedia.org/wiki/Read%E2%80%93eval%E2%80%93print_loop
.. _isatty(3): http://www.openbsd.org/cgi-bin/man.cgi/OpenBSD-current/man3/isatty.3
.. _os.fork: https://docs.python.org/3/library/os.html#os.fork
.. _pty.fork: https://docs.python.org/3/library/pty.html#pty.fork
.. _pty(4): http://www.openbsd.org/cgi-bin/man.cgi/OpenBSD-current/man4/ptm.4
.. _fork(2): http://www.openbsd.org/cgi-bin/man.cgi/OpenBSD-current/man2/fork.2
.. _tmux(1): https://tmux.github.io/
.. _screen(1): https://www.gnu.org/software/screen/
.. _script(1): http://www.openbsd.org/cgi-bin/man.cgi/OpenBSD-current/man1/script.1
.. _ttyrec(1): https://en.wikipedia.org/wiki/Ttyrec
.. _IPython: http://ipython.org/
.. _Travis CI: https://travis-ci.org/
.. _expect(1): http://www.tcl.tk/man/expect5.31/expect.1.html
.. _Don Libes: https://en.wikipedia.org/wiki/Don_Libes
.. _pexpect: http://pexpect.readthedocs.org/en/stable/
.. _Noah Spurrier: http://noah.org
.. _telnet(1): http://www.openbsd.org/cgi-bin/man.cgi/OpenBSD-current/man1/telnet.1
.. _SageMath: http://www.sagemath.org/
