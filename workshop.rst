Technical Writing with Sphinx!
==============================

Welcome to Santa Cruz python users group!

This sheet of paper is a series of commands to help you along with the
*Technical Writing with Sphinx* workshop. If you get lost, don't worry,
these commands can help you catch up, or work ahead if you please!.

This workshop is centered around a detailed article I published of the same
name, available at http://jeffquast.com/post/technical_writing_with_sphinx/

Setup
-----

We will be using a toy project named **Qwack** -- but *any* python project
may be used by simply replacing any occurrence of 'qwack' with your own.

::

        git clone https://github.com/jquast/qwack.git
        easy_install pip   # if you don't have pip!
        pip install virtualenv
        virtualenv qwack/ENV
        . qwack/ENV/bin/activate
        cd qwack
        pip install -e.

From here, you should be able to play the "game" by executing
``python ./qwack/main.py``.  If you are on Windows, or the game
doesn't work for some reason, that's OK, so long as the code
imports successfully, we'll be able to document it.

Sphinx Quicktro
---------------

::

        pip install sphinx
        sphinx-quickstart

Only one question must be answered correctly, the first one::

        > Root path for the documentation [.]:

Key in ``docs`` and press return. Many more questions ensue, there
are no wrong answers, really.

Examine the auto-generated ``docs/index.rst`` file when complete.

Now build your first HTML document::

        sphinx-build -b html ./docs ./htmlout

and view::
       
        open htmlout/index.html

Sphinx level 2
--------------

::

        # unix only
        mv README.rst docs/intro.rst
        ln -s docs/intro.rst README.rst

edit the file ``docs/index.rst`` with your preferred editor,
after the line reading ``:maxdepth: 2``, enter a blank line,
followed by matching indentation, and key in ``intro``::

        .. toctree::
           :maxdepth: 2

           intro

And generate documentation again and view::

        sphinx-build -b html ./docs ./htmlout
        open htmlout/index.html

Sphinx level 3
--------------

Let's edit ``docs/conf.py`` to include the following extensions::

        extensions = [
            'sphinx.ext.autodoc',
            'sphinx.ext.intersphinx',
            'sphinx.ext.viewcode',
        ]

If you answered 'y' to some prompts during ``sphinx-quickstart``, you
may already have these and other extensions enabled.

edit the file ``docs/index.rst`` after the line reading ``intro``,
add another reading ``api``::

        .. toctree::
           :maxdepth: 2

           intro
           api

And create a new file, ``docs/api.rst``::

        API Documentation, wow!
        ========================

        .. automodule:: qwack.main
           :members:
           :undoc-members:

And generate documentation again and view::

        sphinx-build -b html ./docs ./htmlout
        open htmlout/index.html

Sphinx level 4
--------------

Edit docs/intro.rst to try out a few fancy markups::

        .. note:: This is something of note.

        .. warning:: Be careful!

        ::
                def f(x):
                    # this is syntax highlighted as Python code.
                    return x ** 2

        .. code-block:: bash

                function f() {
                    # But any language highlighted by 'pygments' is possible
                    return $(($x ** 2))

        You can refer to your own code, see :class:`qwack.main.Item` class,
        or with the intersphinx extension, core python code, such as the
        :func:`functools.partial`.

And generate documentation again and view::

        sphinx-build -b html ./docs ./htmlout
        open htmlout/index.html

readthedocs.org
---------------

With your docs/conf.py, and your projected hosted on github, this is all
that is necessary to provide continuous publishing to the internet!

Integrating Sphinx and Tox
==========================

::

        pip install tox

edit tox.ini::

        [tox]
        envlist = docs

        [testenv:docs]
        deps = sphinx
        commands = sphinx-build -b html ./docs ./htmlout

Now, to build documentation, all we need to do is execute, ``tox``, so
we can delete ``docs/Makefile`` or ``docs/make.bat`` now, we won't need
them!

tox level 2
-----------

::
        tox -l
        tox -edocs
        tox

Let's modify ``tox.ini``, the line reading ``deps = sphinx`` to read::

        deps = sphinx
               sphinx_rtd_theme

Then, follow the instructions at http://docs.readthedocs.org/en/latest/theme.html
for modifying your ``docs/conf.py`` file::

        import os
        on_rtd = os.environ.get('READTHEDOCS', None) == 'True'

        if not on_rtd:  # only import and set the theme if we're building docs locally
            import sphinx_rtd_theme
            html_theme = 'sphinx_rtd_theme'
            html_theme_path = [sphinx_rtd_theme.get_html_theme_path()]

Run ``tox`` and admire the new, beautiful HTML presentation offered by this theme.

tox level 3
-----------

modify ``tox.ini``, the line reading ``envlist = docs`` to read::

       envlist = lint docs 

and add a new target::

        [testenv:lint]
        deps=restructuredtext_ling
        commands=rst-lint README.rst

Remember that README.rst is a symlink to docs/intro.rst.  We intend to use this
file to publish to PyPi, and want to spare the embarrassment of having a rendering
error causing our raw markup to be presented rather than the intended view. Some
example projects that fail to render on pypi: doc8, placebo

tox level 4
-----------

You can use tox to manage the workflow of projects that aren't even related to python!


For example, the article linked at the beginning of this workflow is published using
a Golang tool called `hugo <https://gohugo.io>`_.  I don't remember how to build,
develop, and publish these articles very easily, so I wrote a tox.ini to manage
this workflow::

        [tox]
        skipsdist=True

        [testenv:build]
        deps = docutils
               pygments
        whitelist_externals = hugo
        commands = hugo --theme=hugo-hikari-theme -d upload

        [testenv:develop]
        deps = docutils
               pygments
        whitelist_externals = hugo
        commands = hugo --theme=hugo-hikari-theme -w server -d /tmp/hugo-develop

        [testenv:publish]
        whitelist_externals = rsync
        commands = rsync -a upload/ ns1:jeffquast.com/

For large projects with many contributors, integrations with external tools and
services, and of course test frameworks, it is not uncommon to provide complex
abstractions over such tools, this one hails from the *blessed* python project::

        [tox]
        envlist = about, sa, sphinx, py{26,27,34,35}
        skip_missing_interpreters = true

        [testenv]
        whitelist_externals = cp
        setenv = PYTHONIOENCODING=UTF8
        passenv = TEST_QUICK TEST_FULL
        deps = -rrequirements-tests.txt
        commands = {envbindir}/py.test {posargs:\
                       --strict --verbose --verbose --color=yes \
                       --junit-xml=results.{envname}.xml \
                       --cov blessed blessed/tests}
                   coverage combine
                   cp {toxinidir}/.coverage \
                       {toxinidir}/._coverage.{envname}.{env:COVERAGE_ID:local}
                   {toxinidir}/tools/custom-combine.py

        # CI buildchain target
        [testenv:coverage]
        deps = coverage
               six
        commands = {toxinidir}/tools/custom-combine.py

        # CI buildhcain target
        [testenv:coveralls]
        passenv = COVERALLS_REPO_TOKEN
        deps = coveralls
        commands = coveralls

        [testenv:about]
        deps = -rrequirements-about.txt
        basepython = python3.5
        commands = python {toxinidir}/bin/display-sighandlers.py
                   python {toxinidir}/bin/display-terminalinfo.py
                   python {toxinidir}/bin/display-fpathconf.py
                   python {toxinidir}/bin/display-maxcanon.py

        [testenv:sa]
        basepython = python3.5
        deps = -rrequirements-analysis.txt
               -rrequirements-about.txt
        commands = python -m compileall -fq {toxinidir}/blessed
                   {envbindir}/prospector \
                       --die-on-tool-error \
                       {toxinidir}
                   {envbindir}/rst-lint README.rst
                   {envbindir}/doc8 --ignore-path docs/_build --ignore D000 docs

        [testenv:sphinx]
        whitelist_externals = echo
        basepython = python3.5
        deps = -rrequirements-docs.txt
        commands = {envbindir}/sphinx-build -v -W \
                       -d {toxinidir}/docs/_build/doctrees \
                       {posargs:-b html} docs \
                       {toxinidir}/docs/_build/html
                   echo "--> open docs/_build/html/index.html for review."

        [testenv:py34]
        # there is not much difference of py34 vs. 35 in blessed
        # library; prefer testing integration against py35, and
        # just do a 'quick' on py34, if exists.
        setenv = TEST_QUICK=1

        [testenv:py26]
        # and python2.6 really only tests 'orderedict' and some various
        # backports of import fallback of features
        setenv = TEST_QUICK=1

        [pytest]
        looponfailroots = blessed
        norecursedirs = .git .tox build

        [coverage]
        rcfile = {toxinidir}/.coveragerc
        rc = --rcfile={[coverage]rcfile}
