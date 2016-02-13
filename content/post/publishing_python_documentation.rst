Publishing Quality Python Documentation
=======================================

Good technical writing for a suitably complex project or technical guide
will require a supporting structure to sufficiently abstract the commands
needed to check and compile a markup language into an HTML site or PDF file
suitable for printing.

We can imagine writing a book about the python language, a program published
to pypi, maybe including a developer API, or a full technical product guide.
Just a few example requirements a technical writer may have that is fulfilled
by sphinx_ and reStructuredText_ as a markup language:

- Cross-referencing *across files* as a hyperlink, not available for
  single-file languages such as Markdown.
- Auto-generate API documentation from the ``""" docstrings """`` you might
  find after function definitions and make them available as link targets.
- Make reference to code from chapters or guides, with hyperlinks targeting
  the API docstring of that code.
- Table of contents, such as provided by common office document programs.
- Syntax highlight and API generation for languages other than python.
- Warn about markup errors, so that a CI system can integrate with markup
  failures, marking failed builds or commit status for pull requests.
- Images and other static content, such as front-end javascript-based code.
- HTML and css, and navigation interface may be applied independent of content.

We will demonstrate how to build a brief python package using tox_.  Although
tox_ is generally regarded for testing, its mechanisms are equally useful for
all command-issuing phases of software development.

By using tox_, we avoid the expense of recalling the commands, or writing
operating system and environment-specific commands in a command file.  This
is abstracted so that a 3-letter command, ``tox`` is all that is necessary
to verify and build a project.

The OpenStack project publishes the doc8_ tool as a style checker for RST
documentation.  This project surprisingly *fails to render* correctly on
`pypi.python.org <https://pypi.python.org/pypi/doc8/0.6.0>`_ due to a markup
syntax error.  By use of tools like ``tox`` with CI integration, we could
prevent publishing this kind of ironic embarrassment.

Sphinx
------

To be quick about it, we create a ``docs/`` sub-folder in our project using the
``sphinx-quickstart`` command, its something like an auto-installer by prompts.

If we become lost, we can just follow along the `First Steps with Sphinx
<http://www.sphinx-doc.org/en/stable/tutorial.html>`_ tutorial.

We create our project introduction as ``docs/intro.rst``, its contents will
become our PyPi front page and our GitHub frontmatter.  We duplicate the
location of this file as by symlinking ``README.rst -> docs/intro.rst``, which
git handles perfectly fine::

        ln -s docs/intro.rst README.rst

This ensures it is available on GitHub's front page.  The same method
can apply for ``CONTRIBUTING.rst`` which is `linked 
<https://help.github.com/articles/setting-guidelines-for-repository-contributors/>`_
to users when they create a pull request.

A simple ``docs/intro.rst`` might look like::

        Introduction
        ============

        Qwack is a toy game.  We're not accepting any contributions, but
        you're welcome to read our code!  It's got a lot of problems, but we'd
        like to share it with you anyway!

And we bind this to ``setup.py`` by writing a short accessory function::

       import setuptools

       def get_long_description():
           import os, codecs
           fpath_here = os.path.dirname(__file__)
           fpath_readme = os.path.join(fpath_here, 'README.rst')
           return codecs.open(fpath_readme, 'r', 'utf8').read()

       setuptools.setup(
           name='qwack',
           packages=['qwack',],
           version=1,
           description='This displays in search results and top of pypi. '
           long_description=get_long_description('README.rst'),
           author='Yours truly,',
       )

Tox
---

We can use tox_ by making targets in our ``tox.ini`` file, making it our
command dashboard for developers and CI systems.  Perform commands to test
our project using py.test_, "lint" and style-check our code and documentation
using prospector_, doc8_, 
using doc8_ and build an HTML documents.

to declare a
prospector_, and
static analysis,

Any deviation of standard style guides from
`pep8 <https://www.python.org/dev/peps/pep-0008/>`_ and `pep257
`https://www.python.org/dev/peps/pep-0257/`_ are enforced, and we can even
lint on reStructuredText_, and report any markup errors.

----

We will add documentation generation, needed to
integrate project testing, linting, documenting, or many build and publish
tasks.



The unfortunate debt of tribal knowledge to do this correctly is the cost to
make use of an evolving suite of free tools and web services that the python
community has developed over time.


  


The use of ``tox`` reduces any special sauce or tribal knowledge to a single
command interface, ensuring a team of sufficient size may easily collaborate
on a large project.  Each tox environment target we specify may be discovered
and executed using the ``tox -l`` and ``tox -e`` command parameters, without
ever viewing ``tox.ini``.

Building HTML
-------------

With this in mind, we create ``tox.ini`` for a short python project named
*qwack*, with a py.test, code lint check, and document lint and generation
step as follows::

        [tox]
        envlist = py35, check, docs

        [testenv]
        deps = pytest
        commands = py.test {posargs:--verbose --verbose} qwack/tests

        [testenv:check]
        basepython = python3.5
        deps = prospector[with_pyroma]
        commands = python -m compileall -fq {toxinidir}/qwack
                   prospector --with-tool pyroma {toxinidir}

        [testenv:docs]
        deps = restructuredtext_lint
               doc8
               sphinx
        commands = rst-lint README.rst
                   doc8 docs/
                   sphinx-build -W -b html docs/

        [pytest]
        norecursedirs = .git .tox

docs
````

Target ``docs`` executes 3 commands:

 #. rst-lint_ for our ``README.rst`` file, ensuring it will not fail to
    render on pypi.
 #. doc8_ to check style of all of our reStructuredText_ files in
    the ``docs/`` sub-folder.
 #. ``sphinx-build`` to generate HTML documentation of our ``docs/`` sub-folder.
    Notably, *turn warnings into errors* is enabled, which informs our CI
    of a failed build.

By running only::

   tox -e docs

testing
```````

The first testenv_ section simply runs our test folder using py.test_, as
suggested `General tips and tricks
<https://tox.readthedocs.org/en/latest/example/general.html#general-tips-and-tricks>`_
in the tox_ guide.

Notably, we make use of ``{posargs}`` so that we can change our test argument
signature by escaping with the unix-traditional getopt ``--``, such as::

    tox -- --looponfail --verbose --verbose

code linting
````````````

The tox target, ``check`` first compiles all of the python files.  This is
the most simple form of Syntax checking -- if the file cannot be byte-compiled,
then this target will exit.

Then, the prospector_ tool is invoked, which front-ends several useful static
analysis and style guide checking programs.  The optional file,
``.landscape.yaml`` can declare an explicit list of exclusions to the rules
that you wish for your team, such as changing the "80-column" rule of pep8
to 120, or disabling it entirely.

By listing exclusions or mccabe complexity values in a yaml file, a team will
have no doubt about which rules are not enforced.  A project can agree by
committee by standard code review process to introduce new code style or lint
exclusions along the same pull request as the change that requires it.
Furthermore, as a cloud service, https://landscape.io can be used to
automatically produce archive reports without installing any tools on your
workstation.

Table of Contents
-----------------
        
A ``docs/index.rst`` creates our final structure::

        =================================
        Welcome to Qwack's documentation!
        =================================

        Contents:

        .. toctree::
           :maxdepth: 3

           intro
           api

We are effectively reproducing the Table of Contents feature of Microsoft Word:
anytime a heading level is used, a hyperlink is managed to that location. The
3rd depth level is optionally specified as the TOC heading limit.  The
contents of two files, ``intro.rst`` and ``api.rst`` are rendered in the HTML
output as the order listed.

We've already introduced ``intro.rst`` as a target for the symlink of our
top-level README file, we can generate API docstrings in file ``api.rst``::

        API Documentation
        =================

        main.py
        -----------

        .. automodule:: qwack.main
           :members:
           :undoc-members:


Advanced Sphinx
---------------

Sphinx extensions such as sphinx-issues_ allows one to write ``:ghissue:`29```
in a release notes or design documents to refer to pull requests or issue
numbers.  Many more examples can be found by querying pypi.org for the term
sphinxcontrib_.

Other extensions, such as sphinx_paramlinks_ extend documenting keyword
arguments with the ability to make hyperlinks from other documents.  A
``overview.rst`` file could refer to important keyword arguments of a
function, for example::

        The :paramref:`Terminal.get_location.timeout` keyword argument can be
        specified to return coordinates (-1, -1) after a blocking timeout.


Advanced sphinx tips
--------------------

- Naturally, our ``docs/conf.py`` file stored in GitHub allows us to
  automatically publish our documentation to readthedocs.org_. Even a printable
  PDF file output with proper hyperlinks for table of contents, page indexes
  and so on using LaTeX, which is very difficult to install on a local
  workstation, cloud service at its best.

- We could modify ``get_long_description()`` function in ``setup.py`` to
  concatenate additional files, such as a ``history.rst`` or
  ``CONTRIBUTING.rst`` directly on PyPi.  The given ``intro.rst`` file
  should be kept brief: introduce the project, its scope or solution,
  installation or usage instructions, then link to any extended online HTML
  documentation, so that users from either PyPi or GitHub have no trouble
  discovering it.

- You may quickly create hyperlinks to the standard python documentation or
  other published projects by intersphinx_::

        This is a context manager for :func:`tty.setcbreak`.

- Does your code use decorators? You might be surprised to find that the
  docstrings of ``contextlib.context_manager`` in place of the docstrings
  you so meticulously labored.  This is natural due to the way decorators
  work, but there is a minor workaround documented here,
  https://github.com/sphinx-doc/sphinx/issues/1711#issuecomment-77558271

- This article is written in reStructuredText_. Sphinx could render, make
  cross-reference with and include it.  But the HTML page of this article
  is rendered using hugo_, a golang project that supports rst through
  the ``rst2html`` tool from the docutils_ project (``pip install docutils``).

- you can use sphinx to document many languages other than Python, most
  certainly the built-in C, C++, and javascript `domains
  <http://www.sphinx-doc.org/en/stable/domains.html>`_ and others by
  extension, such as `scala
  <https://pythonhosted.org/sphinxcontrib-scaladomain/>`_, `java
  <https://bronto.github.io/javasphinx/>`_, or `Go
  <https://pypi.python.org/pypi/sphinxcontrib-golangdomain>`_.

- Don't forget, you can use glob expressions in your Table of Contents,
  this is useful for organizing large sets of documentation across a team,
  or for organizing a book::
  
    .. toctree::
       :maxdepth: 3
       :glob:

       forward
       introduction
       chapters/*
       back_matter/*


.. _sphinx: http://sphinx-doc.org 
.. _sphinx-issues: https://pypi.python.org/pypi/sphinx-issues
.. _readthedocs.org: https://readthedocs.org/
.. _sphinx_paramlinks: https://pypi.python.org/pypi/sphinx-paramlinks
.. _sphinxcontrib: https://pypi.python.org/pypi?%3Aaction=search&term=sphinxcontrib&submit=search
.. _intersphinx: http://www.sphinx-doc.org/en/stable/tutorial.html#intersphinx
.. _reStructuredText: http://docutils.sourceforge.net/docs/ref/rst/restructuredtext.html
.. _testenv: http://testrun.org/tox/latest/example/basic.html#a-simple-tox-ini-default-environments
.. _docutils: https://pypi.python.org/pypi/docutils
.. _tox: https://tox.readthedocs.org/en/latest/
.. _doc8: https://pypi.python.org/pypi/doc8/


[pytest]
looponfailroots = bugs tests

