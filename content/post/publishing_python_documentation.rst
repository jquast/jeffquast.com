Publishing Quality Python Documentation
=======================================

As our documentation grows, how do we bind the three services GitHub_,
readthedocs.org_, and pypi_ in a consistent format?  Minimally, we should
choose reStructuredText_ as our markup language to ensure consistency with
standard python documentation.  This allows us to cross-reference when we use
sphinx_, which is generally regarded as the most advanced documentation tool
the python language has to offer.

The unfortunate debt of tribal knowledge to do this correctly is the cost to
make use of an evolving suite of free tools and web services.  By using tox_,
we avoid exposing this knowledge to other contributors or our future forgetful
self, and implement style checking to ensure we always get it correct.

If you don't think this is hard, I leave you with this simple antidote.
The OpenStack project publishes the doc8_ tool as a style checker for RST
documentation, yet fails to render correctly on `pypi.python.org
<https://pypi.python.org/pypi/doc8/0.6.0>`_.

This is most certainly a zen message.

Package first
-------------

First and foremost, we'll need to present our project through the
``README.rst`` file for GitHub to match PyPi through a small lookup function
embedded in our ``setup.py`` file::

       def get_long_description():
           import os, codecs
           fpath_here = os.path.dirname(__file__)
           fpath_readme = os.path.join(fpath_here, 'README.rst')
           return codecs.open(fpath_readme, 'r', 'utf8').read()

       setup(
           name='qwack',
           packages=['qwack',],
           version=1,
           description='This displays in search results and top of pypi. '
           long_description=get_long_description('README.rst'),
           author='Yours truly,',
       )
        
This binds our ``README.rst`` and the front page of ``setup.py`` together.

Sphinx
------

To be quick about it, we create a ``docs/`` sub-folder in our project using the
``sphinx-quickstart`` command. If we become lost, we can just follow along
the `First Steps with Sphinx
<http://www.sphinx-doc.org/en/stable/tutorial.html>`_ tutorial.

We then **move** our ``README.rst`` file into our ``docs/`` sub-folder,
renaming it ``intro.rst`` -- the pypi and GitHub front page will become the
first linked by our table of contents, introducing the project's purpose.
To satisfy GitHub, we **symlink** our ``README.rst`` file (git handles symlinks
perfectly fine)::

        mv README.rst docs/intro.rst
        ln -s docs/intro.rst README.rst

And construct a table of contents, ``docs/index.rst``::

        =================================
        Welcome to Qwack's documentation!
        =================================

        Contents:

        .. toctree::
           :maxdepth: 3

           intro
           api

We are effectively reproducing the Table of Contents feature of Microsoft Word,
anytime a heading level is used, a hyperlink in the table of contents is
provided.  The contents of two files, ``intro.rst`` and ``api.rst`` are used,
lets look at how our ``intro.rst`` file appears::

        Introduction
        ============

        Qwack is a toy project I made.  We're not accepting any contributions,
        but you're welcome to read our code!  Its actually a toy game that
        I wrote. It's got a lot of problems, but we'd like to share it with
        you anyway!

And API documentation in file ``api.rst``::

        API Documentation
        =================

        main.py
        -----------

        .. automodule:: qwack.main
           :members:
           :undoc-members:

Tox
---

We use tox_ and declare a ``tox.ini`` file, which becomes the command dashboard
for our developers and CI systems.  Through this file, we will perform static
analysis checks of our code and documentation, run our tests, and generate our
documentation. 

The use of ``tox`` reduces any special sauce or tribal knowledge to a single
command interface, ensuring a team of sufficient size may easily collaborate
and test a large project. Each "target" we specify may be discovered and
executed without even examining its contents using the ``tox -l`` and
``tox -e`` command parameters, respectively.

With this in mind, we create ``tox.ini`` as follows::

        [tox]
        envlist = py35, check, docs

        [testenv]
        deps = pytest
        commands = py.test {posargs:--verbose --verbose} qwack/tests

        [testenv:docs]
        deps = restructuredtext_lint
               doc8
               sphinx
        commands = rst-lint README.rst
                   doc8 docs/
                   sphinx-build -v -W -b html docs

        [testenv:check]
        basepython = python3.5
        deps = prospector[with_pyroma]
        commands = python -m compileall -fq {toxinidir}/qwack
                   prospector --with-tool pyroma {toxinidir}

        [pytest]
        looponfailroots = qwack
        norecursedirs = .git .tox

With this, we now have 3 basic targets and can use ``tox`` to execute those
specified by the *envlist* option, or list and execute individual targets. The
target testenv_ is special, allowing invocation of explicit python versions.
For example, to execute the same tests using python2.7, we run::

    tox -epy27

even though ``py27`` is not explicitly defined here, it has an implicit
relationship with testenv_.  If no target is specified, ``py34`` is used
as defined by *envlist*.

Furthermore, we define target ``docs``, which executes ``rst-lint`` for our
``README.rst`` file, ensuring it will not fail to render on pypi.  Then, we use
the ``doc8`` tool to check style of our ``docs/`` sub-folder.  Then, we
generate html documentation using sphinx with *turn warnings into errors*
enabled, which informs our CI (failed build) using a non-zero exit code for any
errors rendering the HTML.

Lastly, the ``check`` target ensures that all python files compile, before
executing the prospector_ tool, which front-ends several useful static analysis
programs with a unified interface using an (optional) ``.landscape.yaml`` file.
Such file can also be parsed by the https://landscape.io service to produce a
CI-integrated HTML report.

From a single ``tox.ini`` file, all stages of software development may be
defined and easily shared.  We've removed the need of programming in any kind
of special shell, batch, or Makefile.  The barriers for discovering how to
prepare an environment and execute tests is reduced for newcomers, and reduces
the cost of making changes in the *test->build->release* cycle.  We may easily
test new versions of python as they are released with minimal changes.

Advanced sphinx tips
--------------------

- Naturally, our ``docs/conf.py`` file stored in github allows us to
  automatically publish our documentation to readthedocs.org_. Even a printable
  PDF file proper hyperlinks for table of contents, page indexes and so on,
  saving you the trouble of installing LaTeX yourself!

- We could modify ``get_long_description()`` function in ``setup.py`` to
  concatenate additional files, such as a ``history.rst`` or
  ``CONTRIBUTING.rst`` directly on PyPi.  The given ``intro.rst`` file
  should be kept brief: introduce the project, its scope or solution, and
  installation or usage instructions, then link to any extended online HTML
  documentation, so that users from either PyPi or GitHub have no trouble
  discovering it.

- Does your code use decorators? You might be surprised to find that the
  docstrings of ``contextlib.context_manager`` in place of the docstrings
  you so meticulously labored.  This is natural due to the way decorators
  work, but there is a workaround documented here,
  https://github.com/sphinx-doc/sphinx/issues/1711#issuecomment-77558271

- Sphinx extensions such as sphinx-issues_ allows one to write
  ``:ghissue:`29``` in a release notes or design documents to refer to pull
  requests or issue numbers.  Many more examples can be found by querying
  pypi.org for the term sphinxcontrib_.

- When documenting keyword arguments, the sphinx_paramlinks_ extension allows
  making hyperlinks to a keyword argument description in machine-readable,
  human-writable format, a ``overview.rst`` file could refer to an API
  keyword argument directly::

        The :paramref:`Terminal.get_location.timeout` keyword argument can be
        specified to return coordinates (-1, -1) after a blocking timeout.

- You may quickly create hyperlinks to the standard python documentation or
  other projects published by sphinx using intersphinx_::

        This is a context manager for :func:`tty.setcbreak`.

- This article is written in reStructuredText_, and you can use sphinx to
  document many languages other than Python, most certainly C, C++, and
  javascript `domains <http://www.sphinx-doc.org/en/stable/domains.html>`_
  as built-ins, and others by extension.

.. _tools/custom-combine.py: https://github.com/jquast/blessed/blob/05a53c6ea66f0e0d440bd0d74aee1e4424be02dd/tools/custom-combine.py
.. _sphinx-issues: https://pypi.python.org/pypi/sphinx-issues
.. _readthedocs.org: https://readthedocs.org/
.. _signalpillar: https://github.com/signalpillar
.. _setenv: http://testrun.org/tox/latest/example/basic.html#setting-environment-variables
.. _passenv: http://testrun.org/tox/latest/example/basic.html#passing-down-environment-variables
.. _pytest.mark.skipif: https://pytest.org/latest/skipping.html#marking-a-test-function-to-be-skipped
.. _testenv: http://testrun.org/tox/latest/example/basic.html#a-simple-tox-ini-default-environments
.. _sphinx_paramlinks: https://pypi.python.org/pypi/sphinx-paramlinks
.. _sphinxcontrib: https://pypi.python.org/pypi?%3Aaction=search&term=sphinxcontrib&submit=search
.. _intersphinx: http://www.sphinx-doc.org/en/stable/tutorial.html#intersphinx
.. _reStructuredText: http://docutils.sourceforge.net/docs/ref/rst/restructuredtext.html
.. _envname: http://testrun.org/tox/latest/plugins.html?highlight=envname#tox.config.TestenvConfig.envname
