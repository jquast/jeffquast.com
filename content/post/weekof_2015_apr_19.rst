---
Categories:
    - Python
Description: Open Source Software Contributions, Week of Apr. 19 2015
Tags:
    - Development
    - FOSS Gardening
    - sqlitedict
    - x84
    - blessings
    - exceptions
    - traceback

date: 2015-04-19T00:00:00-00:00
menu: main
title: Week of Apr 19, 2015
---

blessings
---------

Almost two months since my last "week of": It's still hard to find the time.  Most of my time was
spent working towards merging my fork of blessings ('blessed') back into blessings.  Erik Rose
set a high bar of standards, mostly in documentation, that cost an estimated 40 hours to fulfill.
The result is `PR #104 <https://github.com/erikrose/blessings/pull/104>`_, +9,541 and -1,506.

Lessons with blessings:

- Using `doc8 <https://pypi.python.org/pypi/doc8/0.5.0>`_ for style checking
  of reStructuredText files.  Used this for the entire docs/ folder, loved it!

  Most unfortunate, doc8 is under the umbrella of OpenStack and suffers for
  it: there is no obvious place to communicate with the developers or file
  bug reports (issues are disabled in github).  Began working towards fixing
  one when I discovered it was already fixed `quite some time ago
  <https://github.com/stackforge/doc8/commit/4d82c269ab46f0c5370c1f00be06e0c406164e85#commitcomment-10725927>`_
  but never released to pypi.  Had to explicitly tool tox.ini to chose
  python2.7 for static analysis to workaround the issue using phrase::

      basepython=python2.7

  Later, discovered another bug, but knowing the effort involved in
  submitting a fix towards a possible void, just worked around it by
  editing the files analyzed to avoid the false error.

  I think doc8 should be forked and relinquish control from the lackluster
  OpenStack maintainership which appears typical across most of their
  projects.  I wonder if somebody like `carlio
  <https://github.com/carlio>`_ would be interested in cooperatively growing
  his `prospector <https://github.com/landscapeio/prospector>`_ and
  `landscape.io <https://landscape.io/>`_ projects to fork and incorporate
  such tools.

- Discovered the tool `restructuredtext_lint
  <https://github.com/twolfson/restructuredtext-lint>`_ which serves a single
  purpose: ensure your document will be rendered on pypi.  Used this for the
  README.rst file of the blessings project.

  pypi has some pretty picky reStructuredText rules that differ from the sorts
  of things available with `sphinx <http://sphinx-doc.org/>`_.  Locally, it
  may render perfectly fine.  But, when you upload the project to pypi, the
  server fails to render it (and does not report why), simply dumping the
  content as plaintext, without any styling, formatting, kind hyperlinks,
  or table of contents.

  Previously, I lost a lot of time manually eyeballing a README.rst, and have
  seen many pypi project descriptions fail to discover the cause, hopefully
  that people will prefer github to render it for them. `twolfson
  <https://github.com/twolfson>`_ is a better coder than myself: he was
  frustrated by the same problem, but crafted a tool for it! *Kudos!*

- Setting sphinx-build with "warnings are errors" (``-W``), driven by tox
  and travis-ci ensures all of your documentation is free from errors such
  as invalid cross-referencing, unknown tags, run-on style attributes, or
  mistakes in rst formatting, at least that sphinx-build may determine.

  Unfortunately this also means that some warnings may be wrong. In blessings
  we had one such case: We **do** intend to reference external images, such as
  in the case of "badges" provided by services like http://shields.io.  However,
  this generates a warning and fails the build.

  The solution was to "monkey-patch" method `sphinx.environment.BuildEnvironment.warn_node
  <https://github.com/erikrose/blessings/blob/a562434ef3c681d17a8b2a0b2a9f582a3ff5c093/docs/conf.py#L23-L37>`_
  in the sphinx-generated docs/conf.py as follows::

          import sphinx.environment
          def _warn_node(self, msg, node):
              if not msg.startswith('nonlocal image URI found:'):
                      self._warnfunc(msg, '%s:%s' % get_source_line(node))
                      sphinx.environment.BuildEnvironment.warn_node = _warn_node

  It seems We're not the only one to have had this issue, its been `discussed
  <https://groups.google.com/forum/#!topic/sphinx-users/GNx7PVXoZIU>`_ on
  the sphinx-users mailing list, worked around by `others
  <https://github.com/SuperCowPowers/workbench/issues/172>`_ by using raw
  html instead of ``:img`` references, and asked about on `stackoverflow
  <http://stackoverflow.com/a/28778969>`_, where I shared this solution.

- Context managers and other decorator-wrapped function and method calls render
  as signature ``(**args, **kwds)`` by sphinx.  This was very frustrating
  because we integrated the `sphinx-paramlinks
  <https://pypi.python.org/pypi/sphinx-paramlinks>`_ which allows us to
  cross-reference the parameters of another function or method with a symlink,
  for phrases such as::

      :meth:`~.Terminal.keystroke_input` also accepts optional parameter
      :paramref:`~.Terminal.keystroke_input.raw` which may be set as *True*.

  Ensures that a hyperlink is created directly to the full description of the
  ``raw`` parameter.  But one problem, this particular method is wrapped by
  function decorator ``@contextlib.contextmanager``, and the hyperlink would
  not resolve!

  Luckily, somebody `found a solution
  <https://github.com/sphinx-doc/sphinx/issues/1711#issuecomment-93126473>`_
  to monkey-patch functools.wraps in docs/conf.py::

       import functools
       def no_op_wraps(func):
           """
           Replaces functools.wraps in order to undo wrapping when generating Sphinx documentation
           """
           import sys
           if func.__module__ is None or 'blessings' not in func.__module__:
               return functools.orig_wraps(func)
           def wrapper(decorator):
               sys.stderr.write('patched for function signature: {0!r}\n'.format(func))
               return func
           return wrapper
       functools.orig_wraps = functools.wraps
       functools.wraps = no_op_wraps
       import contextlib
       contextlib.wraps = no_op_wraps

- Code cleanliness: I feel the effort in solid documentation and strict
  enforcement of styling will decrease the effort of application developers
  who chose to integrate with the API and increase the likelihood of
  contributions.

  `@signalpillar <https://github.com/signalpillar>`_ is working towards a fix
  for a bug in tox, and commented on how surprising it was that such poorly
  formatted code could be so popular.

  I feel the same about IPython, whose source code I dived into only to be
  horrified and lost: My vim editor lights up with red colors, highlighting
  all kinds of style, static analysis dangers, and spelling mistakes, making
  it very difficult to read, much less contribute to while restraining the
  natural impulsion of cleaning up unrelated bits as I read them.


sqlitedict
----------

Submitted a pull request to `sqlitedict
<https://github.com/piskvorky/sqlitedict>`_ to resolve a terrible crash
behavior. The solution is rather tricky due to the asynchronous "fire and forget"
method of some kinds of queries.  The solution included a compromise and a
`rather hair-brained solution
<https://github.com/piskvorky/sqlitedict/pull/28>`_:

- if an exception occurs in the inner thread, but the outer thread is not
  awaiting any results, store the exception and allow the outer thread to report
  it on any next query, close, or blocking commit.

- Because the inner thread has its own stack, to ensure the user sees the
  location of the original exception, the stack of the outer thread is *copied*
  into the inner thread, so that it may store and report it should an exception
  occur.

Something interesting: how do you get the stack of the current
thread? By `raising an exception
<https://github.com/python-git/python/blob/715a6e5035bb21ac49382772076ec4c630d6e960/Lib/traceback.py#L273-305>`_!

From traceback.py module::

        try:
            raise ZeroDivisionError
        except ZeroDivisionError:
            f = sys.exc_info()[2].tb_frame.f_back

For a short time, I invested constructing my own object of ``types.TracebackType``
so that the exception thrown the calling thread is for the original location of
the call in the calling thread that caused the exception in the inner one:
however, I favored against that, as it may occur at a time and location of code
that is *not* where and when it actually occurred, opting to raise the exception
from the inner thread, and reporting the original outer thread's stack to the
logger as level ERROR.

Tried https://www.livecoding.tv/ for the first time, and all of this effort
was streamed live and archived:

- https://www.livecoding.tv/video/foss-gardening-sqlitedict-5/
- https://www.livecoding.tv/video/foss-gardening-sqlitedict-6/
- https://www.livecoding.tv/video/foss-gardening-sqlitedict-7/

Though I admit the audience a thing is very limited, approaching 0.  Real
world systems programming is no where near as dramatic as the movies make
it out to be!

I hope to contribute more to sqlitedict, the author very kindly provided me
contributor access for my contribution.


saltstack
---------

A ran into a rare race condition during my $JOB that stems from a very common
mistake made in any programming language::

   if not os.path.isdir(folder_name):
          os.makedirs(folder_name)

If multiple processes or threads are performing this same statement on the same
``folder_name`` there exists a probability that the second call will fail with
``OSError: [Errno 17] File exists: {folder_name}``.

The solution is simple: do not check for path existence at all: simply create
the folder, and expect ``errno.EEXISTS`` as a favorable exception to mean
that the path exists.  This was submitted and accepted as `PR #21409
<https://github.com/saltstack/salt/pull/21409>`_.


others
------

- merged xmodem `PR #12 <https://github.com/tehmaze/xmodem/pull/12>`_ and
  prepared for new release.
- various support, like a `strange issue with sshfs
  <https://github.com/pexpect/pexpect/issues/192>`_
  or `help with pexpect's interact()
  <https://github.com/pexpect/pexpect/issues/196>`_ or `sendline
  <https://github.com/pexpect/pexpect/issues/194>`_
- using pexpect in someone's `pet project
  <https://github.com/thomasballinger/emptystdin/pull/1>`_
- submitted `PR #14
  <https://github.com/ulope/pyformat.info/pull/14>`_ to https://pyformat.info/ to add padding
  "by argument:" -- this particular feature took me quite a while
  to find when I first needed it, hope it helps someone else!
