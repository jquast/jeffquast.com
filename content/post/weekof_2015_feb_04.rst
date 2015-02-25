---
Categories:
    - Python
Description: Open Source Software Contributions, Week of Feb. 04 2014
Tags:
    - Development
    - Python
date: 2015-02-04T00:00:00-00:00
menu: main
title: Week of Feb 04, 2015
---

It has been a bit of a while since I last updated the OSS contributions
I've made, nearly two months.  I worked very hard to `release x/84
</post/releasing-x84-2.0>`_ which took a toll on my energy.  I had a PR
which I listed in my previous post `accepted by paramiko
<https://github.com/paramiko/paramiko/pull/455>`_. x/84 made the rounds
on hacker news and reddit and even made its way into `pycoder's weekly
<http://eepurl.com/bcS5lL>`_. I suggested it to pycoder's weekly last
release and it was ignored.  I think "being voted up on reddit" is their
only indicator of what makes it in, which is too bad, I had to finally
make a reddit account to make such post and I don't plan to use it ever
again.  `pychina's weekly <http://weekly.pychina.org/issue/issue-151.html>`,
If I translate correctly, has some mention that somebody is working to x/84
for Tsinghua bbs, which if I'm not mistaken may be `SMTH
<http://en.wikipedia.org/wiki/SMTH_BBS>`_?

Anyway, here's my last few weeks in review, maybe missing a few:

- after seven months, a fix for sh.py was finally accepted,
  `PR #189 <https://github.com/amoffat/sh/pull/189>`_.
- as well as a suggested fix for sh.py regarding using tcgetattr from the slave,
  rather than the master end of a pty on the "Unix 98's", `Issue #143
  <https://github.com/amoffat/sh/issues/143#issuecomment-44177792>`_.
- added functional tests to the xmodem project. `PR #8
  <https://github.com/tehmaze/xmodem/pull/8>`_.
- A pretty serious bug in xmodem crc checksum failures discovered by
  integration tests to achieve more coverage. `PR #11
  <https://github.com/tehmaze/xmodem/pull/11>`_.
- Sometimes github issues are nothing more than support. I don't know
  how people end up with issues like `these
  <https://github.com/pexpect/pexpect/issues/166>`_ but I was glad to
  be able to help resolve it without much difficulty.
- More fixes to prospector, fixes regressions introduced in a new
  version, `PR #85 <https://github.com/landscapeio/prospector/pull/85>`_.
- after adding FreeBSD to my build infrastructure, caught pexpect bug
  `Issue #180 <https://github.com/pexpect/pexpect/issues/180>`.  Although a
  primary contributor, I do not have the pypi access to release the fix, so it
  remains open at this time.
- Sometimes improving a README is all a project like EtherTerm needs
  to get a little help, `PR #4 <https://github.com/M-griffin/EtherTerm/pull/4>`_

Looking at the PR for sh.py finally being accepted a half year later, I am
reminded of Python `issue #20664 <http://bugs.python.org/issue20664>`_ which,
although patch provided, has gone unresolved.  I'm not sure what to do about
such things, I guess we just wait for more users say "me too" to bring it
to attention again.

Lessons learned:

- after much reflection over the holidays, I believe **ego** to be the
  number one most destructive force in a software engineering team (open
  source or corporate). I may do a post about that after some more thought.

- Support issues disguised and argued as bug reports are incredibly time
  consuming.  It upsets users and drains maintainers from otherwise
  fruitful work.  I have no incentive to contribute to Stack Overflow,
  but I may change documentation

- Several documentation spelling, grammar, or technical errors were discovered
  but unreported because the offending project is not on Github.  The "drive by"
  costs of signing up for a mailing list to email a patch or find and/or reset
  a bitbucket password and learn enough mercurial again just isn't worth it. For
  example, I found a bug in the stty(1) manpage of FreeBSD regarding
  ``imaxcanon``: I won't be creating a bugzilla account for a 1-line diff anytime
  soon.
