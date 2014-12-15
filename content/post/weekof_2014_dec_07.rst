---
Categories:
    - Python
Description: Open Source Software Contributions, Week of Dec. 01 2014
Tags:
    - Development
    - SunOS
    - Shell
date: 2014-12-14T00:00:00-00:00
menu: main
title: Week of Dec 07, 2014
---


Not much this week, just a suggestion to paramiko to remove the error
``channel 0: rcvd big packet 32704, maxpack 16384`` written to stderr from
openssh client when connecting to a paramiko server.  I spent a number of
hours in openssh code and ssh rfc documents.  I wouldn't be surprised if it
is ignored, especially as travis-ci build agent incidentally timed out
making it appear as a failing test.  Regardless, it does get rid of a rather
annoying error on openssh client side:

- `Paramiko <https://github.com/paramiko/paramiko>`_:  Honor openssh out max packet size `#455 <https://github.com/paramiko/paramiko/pull/455>`_

I did receive a number of contributions to my Telnet BBS project:

- `X/84 <https://github.com/jquast/x84/>`_: sftp server, file browser `#145 <https://github.com/jquast/x84/pull/145>`_
- `X/84 <https://github.com/jquast/x84/>`_: Syncterm fix for display_banner and a cp437 switch for the tetris script `#143 <https://github.com/jquast/x84/pull/143>`_ and `#144 <https://github.com/jquast/x84/pull/144>`_

We're hoping to polish out a 2.0 release soon.  I've been trying to do it for quite some time now, but having a difficult time finding the necessary free time.  The contributions from the community are very generous, but often wildly adding features without documenting or polishing or rounding out the configuration items.  I can't blame them, its hard to contribute laborious boring work, you only want to contribute the fun stuff you want yourself!

I would hope this project may be used by somebody who does not know python at all, and may learn python through it, as at least one contributor has done before.  This gets especially more difficult as code size and complexity increases.  I really need to have some kind of "hackathon" to round out a release with well reviewed documentation at some point.

X/84 has been getting more attention (as judged by github "stars" and irc chat) from the east-asian community (japanese, chinese) as well as eastern europe (cyrillic script) which I am very happy for.  I hope I can make some demonstrating Shift-JIS, KOI-8-R, BIG-E and other encoding support, but I would need their help to do translations, at least of a simple "login" and "new user account" prompts in their native language.

Well-internationalized encoding support is something I worked very hard for from the beginning, totally rejecting the traditional "bytes only" perspective that the other bbs systems take.  I am happy that I did, I always imagined that the traditional mystic and synchronet software will continue to remain much more popular than X/84 in the united states, but X/84 will be far more popular in other countries due to its UTF-8 or native encoding language support that such americanized software lacks.  I find the remaining "scene" too americanized anyway, and frankly, the more interesting scene is in western europe such as sweden, finland, norway, and holland.  Americans are typically dumb jerks in comparison.
