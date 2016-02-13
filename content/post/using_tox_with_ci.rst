
see also
http://www.slideshare.net/WmyllPillar/tt-presentationppt



From a single ``tox.ini`` file, all stages of software development may be
defined and easily shared.  We've removed the need of programming in any kind
of OS-dependent bash, batch, or Makefile.  The barriers for discovering how to
prepare an environment and execute tests is reduced for newcomers, and reduces
the cost of making changes in the *test->build->release* cycle.  We may easily
test new versions of python as they are released with minimal changes.

With this, we now have 3 basic targets and can use ``tox`` to execute those
specified by the *envlist* option, or list and execute individual targets. The
target testenv_ is special, allowing invocation of explicit python versions.
For example, to execute the same tests using python2.7, we run::

    tox -epy27

even though ``py27`` is not explicitly defined here, it has an implicit
relationship with testenv_.  If no target is specified, ``py34`` is used
as defined by *envlist*.

Furthermore, w


Advanced tox
------------

- fully featured ... :: 

    commands = {envbindir}/py.test \
               {posargs:\
                   --log-format='%(levelname)s %(relativeCreated)2.2f %(filename)s:%(lineno)d %(message)s' \
                   --cov={toxinidir}/telnetlib3 \
                   --cov-config={toxinidir}/.coveragerc \
                   --strict --verbose --verbose \
                   --junit-xml=results.{envname}.xml\
                   --durations=10\
                   } telnetlib3/tests
               coverage combine
               cp \
                   {toxinidir}/.coverage \
                   {toxinidir}/._coverage.{envname}.{env:COVERAGE_ID:local}
               {toxinidir}/tools/custom-combine.py


- Interestingly, we can create a tox target command to execute only {posargs}
  when given instead of the standard default target::
      

    [testenv:develop]
        deps = pytest
    develop target // loop on fail ..
        looponfailroots = qwack


        [testenv:develop]
        commands = {posargs}

  This allows us to maintain a common environment from which to execute
  commands in. For example, we could specify a flake8_ dependency along
  with the project's ``requirements.txt`` file and execute our preferred
  emacs or vim editor::

        tox -edevelop -- vim qwack/main.py

  (idea contributed by signalpillar_)

- Our CI systems can make use of the ``{posargs:default value}`` to generate
  a great deal of detail, here is a more complex py.test command that
  produces a jUnit xml file and coverage report by envname_::

        deps = pytest-cov
               pytest
        commands = {envbindir}/py.test {posargs:\
                       --strict --verbose --verbose --color=yes \
                       --junit-xml=results.{envname}.xml \
                       --cov qwack qwack/tests}

- To create test groups, or a "quick test" feature, we can use the tox setenv_
  and passenv_ options to specify a ``TEST_QUICK`` environment variable,
  conditioned by `pytest.mark.skipif`_::

      import pytest

      @pytest.mark.skipif(os.environ.get('TEST_QUICK', None) is not None,
                          reason="TEST_QUICK specified")
      def test_something_very_slow():
          ...

  Would allow command invocation from bash as ``QUICK=1 tox -epy35`` when used
  with passenv_, or a specific ``quicktest`` target using setenv_ to skip such
  long-running tests in our testenv_ target.

- When integrating with a CI system, one should still provide simple
  ``test.sh``, ``build.sh``, or ``publish.sh`` targets, even if they drive
  tox, this allows us track precisely which tox targets are used in pairing
  stages of a build.  This way, if the CI system reports a failure in the
  publish step, a developer should be able to execute ``publish.sh`` locally
  to reproduce, while also allowing changes in build stages to be tracked
  by version control.  Release engineers should avoid placing special shell
  code inside HTML textarea windows, which would fail to accommodate making
  historic builds, or allow changes to the build steps without peer review.

- We can use passenv_ to allow our CI system to publish our coverage to the
  https://coveralls.io service, or communicate with Jira or GitHub without
  storing them in VCS by using environment variables::

      [testenv:coveralls]
      passenv = COVERALLS_REPO_TOKEN
      deps = coveralls
      commands = coveralls

  The environment variable ``COVERALLS_REPO_TOKEN`` would be hidden from any
  non-administrator accounts of the CI system, and outside of VCS.

- We can even combine our coverage across python interpreters, generate an HTML
  report, and emit special strings to notify our CI system of our coverage
  values with a custom script, such as the `tools/custom-combine.py`_ file of
  the blessed project with careful tox integration::

           [testenv]
           whitelist_externals = cp
           commands = py.test --cov qwack qwack/tests {posargs}
                      coverage combine
                      cp {toxinidir}/.coverage \
                          {toxinidir}/._coverage.{envname}.{env:COVERAGE_ID:local}
                      {toxinidir}/tools/custom-combine.py

           # CI buildchain target
           [testenv:coverage]
           deps = coverage six
           commands = {toxinidir}/tools/custom-combine.py

  We provide two targets, the first default target always executes py.test
  with ``--cov`` unconditionally, allowing extra parameters by ``--``.

  Then, the coverage file is duplicated to a pattern unique for the build
  environment, hidden, but prevented from further combining using
  ``COVERAGE_ID``, perhaps as *linux* or *windows* to specify the OS platform
  of the build slave, and envname_

  The CI system may collect these coverage files by pattern,
 
  build step, such as a file named ``./build.sh`` should
  contain the additional explicit target execution, ``tox -ecoverage``

.  We would simply invoke this command at the end of each
  testenv_ target::
  This would move each invocation to a unique file name, such as
  ``windows``.  When unset (default), the term 'local' is used, instead.  By
  collecting each coverage output file in a build series, we may report on
  coverage of our full platform matrix.

- Do you have shell code? Use shellcheck_ to discover

.. _envname: http://testrun.org/tox/latest/plugins.html?highlight=envname#tox.config.TestenvConfig.envname

.. _testenv: http://testrun.org/tox/latest/example/basic.html#a-simple-tox-ini-default-environments

.. _tools/custom-combine.py: https://github.com/jquast/blessed/blob/05a53c6ea66f0e0d440bd0d74aee1e4424be02dd/tools/custom-combine.py

.. _signalpillar: https://github.com/signalpillar
.. _setenv: http://testrun.org/tox/latest/example/basic.html#setting-environment-variables
.. _passenv: http://testrun.org/tox/latest/example/basic.html#passing-down-environment-variables
.. _pytest.mark.skipif: https://pytest.org/latest/skipping.html#marking-a-test-function-to-be-skipped




