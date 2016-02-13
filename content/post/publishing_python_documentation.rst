Publishing Quality Python Documentation
=======================================

As our documentation grows, how do we bind the three services GitHub_,
readthedocs.org_, and pypi_ in a consistent format?  Minimally, we should
choose reStructuredText as our markup language to ensure consistency with
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

We can modify our ``get_long_description()`` function to concatenate multiple
files, such as a ``history.rst`` for release notes as the return value string.

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

        qwack.py
        -----------

        .. automodule:: qwack
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
                   prospector {toxinidir}

        [pytest]
        looponfailroots = qwack
        norecursedirs = .git .tox

With this, we now have 3 basic targets and can use ``tox`` to execute those
specified by the *envlist* option, or list and execute individual targets. The
target *testenv* is special, invoked using any specified version of python, we
could execute our tests defined by ``testenv`` with python2.7 using command
``tox -epy27``, even though ``py27`` is not explicitly defined here.  We
specify the default python version used as ``py35`` in our *envlist* option.

Furthermore, we define target ``docs``, which executes ``rst-lint`` for our
README.rst file, ensuring it will not fail to render on pypi.  Then, we use
the ``doc8`` tool to verify our rst documentation of our ``docs/`` sub-folder.
Then, we generate html documentation using sphinx with *turn warnings into
errors* enabled, which informs our CI and shell of a non-zero exit code for
any errors when rendered.

Lastly, the ``check`` target first ensures that all python files compile for
our target python version (3.5), before executing the prospector_ tool, which
front-ends several useful static analysis utilities with a unified
configuration and command interface in a ``.landscape.yaml`` file.  This same
file can be parsed by the https://landscape.io service to produce a
CI-integrated HTML report of static analysis results.

From a single ``tox.ini`` file, all stages of software development may be
defined and easily shared.  We've removed the need of programming in any kind
of special shell, batch, or Makefile.  The barriers for discovering how to
prepare an environment and execute tests is reduced for newcomers, and reduces
the cost of making changes in the *test->build->release* cycle.  We may easily
test new versions of python as they are released with minimal changes.
