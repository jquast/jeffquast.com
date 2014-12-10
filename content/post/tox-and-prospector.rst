---
Categories:
    - Python
Description: Integrating tox and prospector for Static Analysis
Tags:
    - Development
    - Python
    - Static Analysis
date: 2014-12-09T00:00:00-00:00
menu: main
title: Integrating tox and prospector for Static Analysis
---


My integration scheme usually works somewhat like this, though it changes in complexity per project:

- ``README.rst`` that suggests a **Developing** section, specifying that virtualenv and pip are required and instructs the developer to use prepare an existing virtualenv environment for testing using,
- ``python setup.py develop``, achieved by a custom SetupDevelop command class in setup.py, that derives the ``run()`` method to assert that ``os.getenv('VIRTUAL_ENV')`` is defined (to remind you not to pollute your environment accidentally), run the baseclass ``setuptools.command.develop.develop.run()``, which installs the egg link to allow rapidly editing without re-installing, and then call ``self.spawn(('pip', 'install', '--upgrade', '--requirement', 'requirements-dev.txt'))``.
- *setup.py* file contains:

  ::

       from setuptools.command.develop import develop

       class SetupDevelop(develop):

       """ 'setup.py develop' is augmented to install development tools. """

           # pylint: disable=R0904
           #         Too many public methods (43/20)

           def run(self):
               """ Execute command pip for development requirements. """
               # pylint: disable=E1101
               # Instance of 'SetupDevelop' has no 'spawn' member (col 8)
               assert os.getenv('VIRTUAL_ENV'), 'You should be in a virtualenv'
               develop.run(self)
               self.spawn(('pip', 'install', '--upgrade', '--requirement', 'requirements-dev.txt'))

       setup(
           name=PACKAGE_NAME,
           version=VERSION,
           (...)
           cmdclass={
               'develop': SetupDevelop,
           },
       )


- *requirements-dev.txt* file contains:

  ::

          # This file contains dependencies required for running tests, and any other
          # miscellaneous developer tools
          tox
          IPython

- *tox.ini* file contains:

  ::

       [tox]
       envlist = prospector,
                  py27,
                  py34,
       [testenv]
       # for any python, run simple pytest with coverage
       deps = -r{toxinidir}/requirements-testing.txt
       commands = {envbindir}/py.test --strict --cov {envsitepackagesdir}/PACKAGENAME \
                  PACKAGE/TESTS {posargs}

       [testenv:prospector]
       # run static analysis using prospector
       deps = -r{toxinidir}/requirements-analysis.txt
       commands = prospector \
                      --die-on-tool-error \
                      --test-warnings \
                      --doc-warnings \
                      {toxinidir}

- *requirements-testing.txt* file containing:

  ::

        # This file contains python dependencies required by tox when running tests
        webtest==2.0.6
        pytest==2.6.4
        pytest-cov==1.6

- *requirements-analysis.txt* file containing:

  ::

        prospector[with_dodgy,with_frosted,with_mccabe,with_pep257,with_pep8,with_pyroma,with_vulture]

- and a sample *.prospector.yaml* file containing:

  ::

        inherits:
          - strictness_veryhigh

        ignore:
          - (^|/)\..+
          - ^docs/
          - ^build/

        test-warnings: true

        output-format: grouped

        dodgy:
            # Looks at Python code to search for things which look "dodgy"
            # such as passwords or git conflict artifacts
            run: true

        frosted:
            # static analysis
            run: true

        mccabe:
            # complexity checking.
            run: true

        pep257:
            # docstring checking
            run: true

        pep8:
            # style checking
            run: true
            options:
                max-line-length: 100

        pyflakes:
            # preferring 'frosted' instead (a fork of)
            run: false

        pylint:
            # static analysis and then some
            run: true
            options:
                max-line-length: 100
                # allow 'log' as global constant
                const-rgx: "(([A-Z_][A-Z0-9_]*)|(__.*__)|log)$"
                const-hint: "(([A-Z_][A-Z0-9_]*)|(__.*__)|log)$"
                # pytest module has dynamically assigned functions,
                # raising errors such as: E1101: Module 'pytest' has
                # no 'mark' member
                ignored-classes: pytest
            disable:
                # Too many lines in module
                - C0302
                # Used * or ** magic
                - W0142
                # Used builtin function 'filter'.
                # (For maintainability, one should prefer list comprehension.)
                - W0141

        pyroma:
            # checks setup.py
            run: true

        vulture:
            # this tool does a good job of finding unused code.
            run: true

The workflow then simply becomes:

1. create or active a virtualenv (mkvirtualenv, workon, etc.)
2. run ``./setup.py develop``
3. run ``tox``, or optionally just ``tox -eprospector`` for static analysis
