---
Tags:

    - Sphinx
    - reStructuredText
    - tox
    - prospector
    - doc8
    - linting
    - api
    - toc
    - documentation
    - readthedocs.org

date: 2016-02-13T00:00:00-00:00
menu: main
title: Technical writing with sphinx
---

Good technical writing for a suitably complex python project, technical guide,
or even a book, will require a supporting structure to sufficiently abstract
the commands needed to check and compile it.

Writing a guidebook across a team of writers and developers, we can integrate
sphinx_, tox_, and many other free tools and services.  Many features of
sphinx are listed on their `Welcome <http://www.sphinx-doc.org/en/stable/>`_
page, but this article will focus on:

- Using tox_ to automate checking our reStructuredText markup.
- Cross-platform builds without any ``Makefile`` or ``make.bat``.
- Create API documentation from ``""" docstrings """`` in code.
- Uniformly present an introduction on GitHub, PyPi, and readthedocs.org_.

Sphinx
------

To be quick about it, we using the ``sphinx-quickstart`` command, specifying
``./docs/`` when prompted for the folder for sphinx to generate documentation.
If we become lost, we can just follow along the `First Steps with Sphinx
<http://www.sphinx-doc.org/en/stable/tutorial.html>`_ tutorial.

We create an important file pattern: our introduction chapter as file
``docs/intro.rst``, and symlink ``README.rst`` to that file.  Git manages
symlinks in version control perfectly fine, and GitHub follows the symlink
target when rendering the top-level ``README.rst`` and ``CONTRIBUTING.rst``
files

Creating the symlink::

        ln -s docs/intro.rst README.rst

And a demo ``docs/intro.rst``:

.. code:: rst

        Introduction
        ============

        Qwack is a toy game.  We're not accepting any contributions,
        but you're welcome to read our code!

We bind this to PyPi using a short accessory function in ``setup.py``:

.. code:: python

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
           description='This displays in search results and top of pypi.'
           long_description=get_long_description('README.rst'),
           author='Yours truly,',
       )

- We could modify the ``get_long_description()`` function to concatenate
  additional files, such as a ``history.rst`` or ``CONTRIBUTING.rst`` to
  its result string, so that they appear directly on PyPi.  PyPi supports
  only reStructuredText-formatted files for markup.


Tox
---

Although tox_ is generally regarded for running tests, the tox workflow
is multi-purpose due to its simple workflow similar to a 'containerization'
model:

- create a virtualenv_
- install dependencies.
- build and install our project by setup.py
- run 1 or more commands

Because virtualenv_ is used, execution speed is fast but uniform across all
contributing parties.  Command execution is defined by an OS-independent
``.ini`` file, so Makefile, PowerShell, or bash is avoided.  tox_ then
becomes our command dashboard for all contributors and CI systems so that
the environment may be reliably reproduced.

tox.ini
```````

With this in mind, we create a ``tox.ini`` with testenv_ target, '``docs``':

.. code:: ini

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

The section ``[testenv:docs]`` declares the environment and commands needed
to perform a lint check and build HTML documentation.  Each tox environment
target we specify may be discovered and using ``tox -l`` and executed using
``tox -e`` command parameters::

        $ tox -l
        py35
        check
        docs

        $ tox -e docs


The others are
described here, under section title, `More on Tox`_.

The 'docs' target
`````````````````

Target ``[testenv:docs]`` executes 3 commands:

#. rst-lint_ for our ``README.rst`` file, ensuring it will not fail to
   render on PyPi.

#. doc8_ to check style of all of our reStructuredText_ files in
   the ``docs/`` sub-folder. 

   The doc8_ PyPi page **fails to render** on `pypi.python.org
   <https://pypi.python.org/pypi/doc8/0.6.0>`_ due to a **markup syntax
   error**.  They should have used rst-lint_!

#. ``sphinx-build`` to generate HTML documentation of our ``docs/``
   sub-folder.  Notably, *turn warnings into errors* is enabled, which
   informs our CI of a failed build.

Any user with tox installed can perform these actions using::

   tox -e docs

Cross-referencing
-----------------

At its very best, sphinx_ has astounding support for cross-referencing,
whether by referencing functions, classes, or objects in code, other
section titles, or even external documentation.

For our example document, we'd like to introduce a simple TOC in
``docs/index.rst``:

.. code:: rst

        =================================
        Welcome to Qwack's documentation!
        =================================

        Contents:

        .. toctree::
           :maxdepth: 3

           intro
           api

Each section title up to the 3rd depth level optionally set here is rendered
here as a hyperlink.  The first title here, "Welcome to Qwack's documentation!"
is the first depth level, simply because it is the first one used. Depth levels
are defined by a novel identification of `title adornment characters
<http://docutils.sourceforge.net/docs/ref/rst/restructuredtext.html#sections>`_.

The contents of two files, ``intro.rst`` and ``api.rst`` are also referenced
here the first is our top-level project README, and the second ``api.rst``::

        API Documentation
        =================

        This is the code documentation for developers, beware!

        Begin with the Introduction_ section if you're lost!

        main.py
        -------

        .. automodule:: qwack.main
           :members:
           :undoc-members:

       
glob_ expressions may also be used::

  
        .. toctree::
           :maxdepth: 3
           :glob:

           forward
           introduction
           chapters/*
           back_matter/*
           glossery


We can now refer to the target ```main.py`_`` anywhere else in our docs,
and the hyperlinks are managed appropriately by their title.  We can also
make reference to our API documentation, or even standard python
documentation::

        This is a context manager for :func:`tty.setcbreak`.

This is made possible with intersphinx_, external references made outside of
sphinx may also be checked by adding the ``sphinx-build`` argument
``-blinkcheck``, this can ensure links to external resources are verified at
the time of the build or publication date.

Extensions
----------

Sphinx extensions such as sphinx-issues_ adds *domains*, such as
``:ghissue:`29``` to refer to pull requests or issue numbers on GitHub.
sphinx_paramlinks_ extends api links even further to allow referencing
function arguments, For example::

        The :paramref:`Terminal.get_location.timeout` keyword argument can be
        specified to return coordinates (-1, -1) after a blocking timeout.

Unlike their "Markdown-flavored" derivatives, these *domains* allow rendering
through unsupported extensions.  More extensions can be found by querying
pypi.org for the term, 'sphinxcontrib_'.

readthedocs.org
---------------

The ``docs/conf.py`` file created using ``sphinx-quickstart`` and publishing
to GitHub are the only two requirements needed to use readthedocs.org_.

As a bonus, readthedocs.org_ can create a PDF file for us, which would
otherwise require installing LaTeX on our local workstation which can be
difficult, even for developers!

If we like the way readthedocs.org_ looks, we can install the
sphinx_rtd_theme_ dependency and build the same HTML/css format locally.

Advanced Sphinx
---------------

What we've covered here is something like a follow-up to the
`Documenting Your Project Using Sphinx
<https://pythonhosted.org/an_example_pypi_project/sphinx.html>`_ article,
so please give it a read if you are new to sphinx_ or reStructuredText.

You can use sphinx to document many languages other than Python, most
certainly the built-in C, C++, and javascript `domains
<http://www.sphinx-doc.org/en/stable/domains.html>`_ and others by
extension, such as `scala
<https://pythonhosted.org/sphinxcontrib-scaladomain/>`_, `java
<https://bronto.github.io/javasphinx/>`_, or `Go
<https://pypi.python.org/pypi/sphinxcontrib-golangdomain>`_.

More on Tox
-----------

Reviewing the ``tox.ini`` listed earlier, we see a pytest_ command
from our testenv_ section, as suggested by the tox guide section,
`General tips and tricks`_.

Notably, we make use of ``{posargs}`` so that we can change our test argument
signature by escaping with the traditional getopt_ delimiter ``--``::

    tox -epy35 -- --looponfail --exitfirst qwack/tests/core.py

There are currently over 22,000 ``tox.ini`` file examples on GitHub using the
query, '`filename:tox.ini <https://github.com/search?q=filename%3Atox.ini>`_'.
Some of them are rather creative.

Code Linting
````````````

The tox target, ``check`` first compiles all of the python files.  This is
the fastest and simplest form of Syntax checking -- if the file cannot be
byte-compiled, then this target will exit and alert early.

Then, the prospector_ tool is invoked, which front-ends several useful static
analysis and style guide-enforcing programs.  With prospector_, we declare an
explicit list of exclusions to the rules that you wish for your team, such as
changing the "80-column" rule of pep8 to 120, or adjusting mccabe complexity
values in the optional file, ``.landscape.yaml``

.. code:: yaml

        inherits:
            - strictness_veryhigh

        ignore-patterns:
            - (^|/)\..+
            - ^docs/
            - ^build/
            - ^qwack/tests

        pep8:
          options:
              max-line-length: 120

        pylint:
            options:
                ignored-classes: pytest
                good-names: _,ks,fd
                persistent: no

            disable:
                - protected-access
                - too-few-public-methods
                - star-args
                - wrong-import-order
                - wrong-import-position
                - ungrouped-imports

Contributors then have no doubt about which style rules are enforced, this
file becomes a contract among developers and enforced by our CI.  The same
review process for code changes are used to propose changes.

By using GitHub, the cloud service https://landscape.io can benefit us with
archive access to HTML reports, without installing any of these tools on our
workstation.

Closing remarks
---------------

Although the tools we've used are written in python, we don't require knowing
the python language to use them.  This article is rendered by a program written
in go, for example.  By using tox_, we reduce the knowledge barrier for
contributions and ensure consistent behavior between team members and their
windows, mac, or linux server platforms.

By separating our editor and builder, as well as our content from presentation,
we allow multiple contributors to work on all of these parts independently.
Through version control and workflows offered by basic web services, we achieve
more discipline of quality and efficiency through these tools than even the
most premium "Office" software suites can offer.

.. _sphinx: http://sphinx-doc.org 
.. _sphinx-issues: https://pypi.python.org/pypi/sphinx-issues
.. _readthedocs.org: https://readthedocs.org/
.. _sphinx_paramlinks: https://pypi.python.org/pypi/sphinx-paramlinks
.. _sphinxcontrib: https://pypi.python.org/pypi?%3Aaction=search&term=sphinxcontrib&submit=search
.. _intersphinx: http://www.sphinx-doc.org/en/stable/tutorial.html#intersphinx
.. _reStructuredText: http://docutils.sourceforge.net/docs/ref/rst/restructuredtext.html
.. _testenv: http://testrun.org/tox/latest/example/basic.html#a-simple-tox-ini-default-environments
.. _tox: https://tox.readthedocs.org/en/latest/
.. _doc8: https://pypi.python.org/pypi/doc8/
.. _rst-lint: https://pypi.python.org/pypi/restructuredtext_lint
.. _pytest: http://pytest.org/latest/
.. _prospector: https://pypi.python.org/pypi/prospector
.. _virtualenv: http://virtualenv.readthedocs.org/en/latest/
.. _`General tips and tricks`: <https://tox.readthedocs.org/en/latest/example/general.html#general-tips-and-tricks>
.. _glob: https://en.wikipedia.org/wiki/Glob_%28programming%29
.. _sphinx_rtd_theme: https://pypi.python.org/pypi/sphinx_rtd_theme
.. _getopt: http://man7.org/linux/man-pages/man1/getopt.1.html#DESCRIPTION
