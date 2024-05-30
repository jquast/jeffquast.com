---
Categories:
    - Python
Tags:
    - HAMURABI.BAS
    - Sumerian
    - Strategy
    - Game
    - Finance
    - Politics

date: 2024-03-05T00:00:00-00:00
menu: main
title: HAMURABI.BAS and its dystopian lessons
---

*This is not financial or political advice*

HAMURABI.BAS
============

`The Sumerian Game <https://en.wikipedia.org/wiki/The_Sumerian_Game>`_ was
featured in `David H. Ahl <https://en.wikipedia.org/wiki/David_H._Ahl>`_'s book,
`Basic Computer Games (1973)
<https://en.wikipedia.org/wiki/BASIC_Computer_Games>`_ as "`Hamurabi
<https://en.wikipedia.org/wiki/Hamurabi_(video_game)>`_" and was one of the
first books I checked out from the school library and one of the very first
computer games I played.

I played it again recently on a replica_ of the Apple 1 computer.  I then ported
it to python to better understand the rules and design winning strategies, and
finally, I wrote an "automatic player" to exercise those strategies.

The strategies revealed some surprising financial and political lessons,
probably antithetical to its original purpose as an educational game for sixth
graders.


Video of `apple1-HAMURABI.TXT <https://github.com/jquast/hamurabi.py/blob/develop/apple1-HAMMURABI.TXT>`_,

.. raw:: html

    <video controls="controls" width="800" height="600" name="My First tile engine">
      <source src="https://www.jeffquast.com/apple1-hamurabi.mov">
    </video>

City-building game
==================

Wikipedia writes that `HAMURABI.BAS`_ is an antecedent of the `city-building
game <https://en.wikipedia.org/wiki/City-building_game>`_
genre. The game can be summarized as follows:

- You are given 10 turns to buy or sell land, feed your people, and plant grain.

The static rules for each turn are:

- Each person requires 20 bushels of food (`line 540 <https://github.com/philspil66/Hamurabi/blob/main/hammurabi.bas#L75>`_).

- Each acre requires 2 bushels of food to seed (`line 510 <https://github.com/philspil66/Hamurabi/blob/main/hammurabi.bas#L62>`_).

- Each acre requires 10 people to plant it with seed (`line 455 <https://github.com/philspil66/Hamurabi/blob/main/hammurabi.bas#L59>`_).

- The game ends on the 11th turn (`line 21 <https://github.com/philspil66/Hamurabi/blob/main/hammurabi.bas#L21>`_)

- Wealth is calculated as *acres / population* (`line 99 <https://github.com/philspil66/Hamurabi/blob/main/hammurabi.bas#L99>`_)

- Starving 45% or more of the population results in impeachment (failure) (`line 552`_).

The dynamic rules (random chances) for each turn:

- You may harvest between 1 and 5 bushels per acre (`line 515 <https://github.com/philspil66/Hamurabi/blob/main/hammurabi.bas#L65>`_).

- The value of land is between 17 and 27 bushels per acre (`line 310 <https://github.com/philspil66/Hamurabi/blob/main/hammurabi.bas#L22>`_).

- Rats may eat 1/4, 1/2, or all grains in store (`line 522`_).

- Infants may be birthed according to available acres and food (`line 533 <https://github.com/philspil66/Hamurabi/blob/main/hammurabi.bas#L73>`_).

- There is a 15% chance of plague, reducing population by 50% (`line 542`_).

The game completes with one of 4 basic scores:

- **Worst**, *"[...] You have also been declared national fink!!!!"*: 33% or more of the population has starved, or wealth is less than 7 (`line 880 <https://github.com/philspil66/Hamurabi/blob/main/hammurabi.bas#L102>`_).

- **OK**, *"The people (remianing) [...] frankly, hate your guts!!"*: 10-33% of the population has starved, or wealth is less than 9 (`line 890 <https://github.com/philspil66/Hamurabi/blob/main/hammurabi.bas#L104>`_).

- **Good**, *"[...] People would dearly like to see you assassinated"*: 3-10% of the population has starved, or wealth is less than 10 (`line 895`_).

- **Best**, *"A fantastic performance!!!"*: all other cases (`line 900 <https://github.com/philspil66/Hamurabi/blob/main/hammurabi.bas#L108>`_).

Basic Strategy
==============

When I loaded this onto my Apple 1 and played a few rounds, I was reminded of
how difficult it was to play this game as a child. I pulled out a HP-15C
calculator and used this basic strategy:

- Calculate the amount of grain needed to feed the population and seed plantable acres.

- If there is not enough grain, then sell enough land to ensure there is.

- If there is a surplus of grain, purchase land.

To aide this, I also rewrote the game from basic to python (`hamurabi.py
<https://github.com/jquast/hamurabi.py/blob/develop/hamurabi.py>`_), so that I
could better understand the rules.

However, I still kept losing approximately 1 out of 5 games

Winning Strategy?
=================

I wrote an automatic program that allowed me to input the current figures and it
would suggest actions for each turn, and continually adjusted my strategy.

After some time, by increasing my odds of winning through changes of strategy, I
adjusted this program to automatically play the game against my apple 1 replica_.

Although I could play the game locally with `pexpect
<https://github.com/pexpect/pexpect/>`_, and much more quickly with pure
calculation, I enjoyed making something like an "automatic screensaver" for my
Apple 1 replica_, to pit computer versus computer.

I toyed with this strategy for several weeks while I wondered, **is there a
strategy to always win this game, or is it rigged?**

Rats!
=====

- Rats may eat 1/4, or 1/2, or all of grain in store (`line 522`_)

That the rats have a random chance of eating some or all grain in store is the
greatest risk of `HAMURABI.BAS`_.

My first strategy was to calculate the chances of how much grain rats may eat,
and ensure there is sufficient grain to allow for feeding and planting after
accounting for the risk.

I started with a sliding scale variable, from liberal to conservative, and,
to modify this value in proportion to wealth.

I struggled with the strategy for many days until I finally realized that rats
can't eat grain that isn't there: We should aim to *carry the minimum amount of
grain needed* to feed our population and seed our plantable acres.

Land
====

We "bank" our surplus grain by purchasing land. We can purchase far more land
than is necessary, sometimes as much as 4x more acres than needed to win the
game, leaving hundreds of acres unplantable.

This land acts as an investment, available for sale on poor harvest years. 

We don't have any care for the value of land. Though it is variable, it would be
foolish to try to "play the stock market", as any amount of bushels not
invested in land is at risk of being eaten by rats.  Purchasing land ensures
safe store of value -- **rats cannot eat land!**

*Financial lesson*: **All but your emergency fund should be invested.**

Plague!
=======

- There is a 15% chance of plague, reducing population by 50% (`line 542`_).

This sounds awful, to lose 50% of your population in a year!  However, these
deaths are not counted against your score, only deaths by starvation.

Your population is always growing, which reduces wealth (acres per person), and
plagues immediately **double the wealth** of your remaining population. plagues
are an act of god, nobody blames you for this.  It is surprisingly advantageous
to have a plague, you should look forward to it!

*Political lesson*: **Bioweapons are surprisingly effective at increasing the
wealth of the remaining population.**

Starvation
==========

Starving 45% or more of the population results in impeachment (failure) (`line
552`_), and starving any more than 3% of the population results in a reduced
score (`line 895`_).

**But this means up to 3% of the population can be starved without consequences!**

As wealth is the only other determining factor of your score, and that wealth
is a function of the number of acres per person, reducing the population by
starvation is advantageous.

By systematically reducing the population by 3% each turn, we reduce the number
of mouths to feed, and increase the wealth of the remaining population.

*Political lesson*: **A little bit of "world hunger" effectively increases the
wealth of the remaining population.**

First turn
==========

In the year prior to your first term, your predecessor successfully harvested
3 bushels per 1,000 acres of land and rats have eaten only 200 bushels,
leaving you with 2,800 bushels to feed 100 people.

Given our "Winning Strategy", on the first turn you should:

- Feed your people 1,940 bushels of food (systematically starving 3 of them).

- Plant all 1,000 acres with 500 bushels of food.

- Buy land with remaining 360 bushels.

Final Turn
==========

The game completes on the 11th turn, but the 10th turn is the final turn to
decide how much to feed your people and how many acres to plant with seed.
However, the game *does not account for how much food is remaining* after
your final turn, only the wealth represented by acres of land.

Therefore, on your final turn you should continue to calculate to feed your
people enough food to systematically starve 3% of the population, and **plant 0
acres** for food.

*Political lesson*: **You will be remembered for only the actions of the years
you are in office, not by the consequences left to your successor.**

Autoplayer
==========

Video of `play-hamurabi-vs-apple-1.py <https://github.com/jquast/hamurabi.py/blob/develop/play-hamurabi-vs-apple-1.py>`_,

.. raw:: html

    <video controls="controls" width="800" height="600" name="My First tile engine">
      <source src="https://www.jeffquast.com/hamurabi-autoplayer.mov">
    </video>

Conclusion
==========

By implementing the strategy outlined above, we can win 99% of games played, 95%
with the highest possible score.

I'm a very big fan of `Will Wright
<https://en.wikipedia.org/wiki/Will_Wright_(game_designer)>`_, `SimCity
<https://en.wikipedia.org/wiki/SimCity_(1989_video_game)>`_, and `SimCity 2000
<https://en.wikipedia.org/wiki/SimCity_2000>`_, and the works of `Jay Wright
Forrester <https://en.wikipedia.org/wiki/Jay_Wright_Forrester>`_ that `inspired
the mechanics <https://logicmag.io/play/model-metropolis/>`_ of those games.

`HAMURABI.BAS`_ is a very simple, perhaps the most simple, city-building game of
all time at just 100 lines of BASIC code. Even so, solving for the optimal
winning strategy provided insights into our financial and political systems,
likely beyond the intent of the original authors.

This interaction of the player's mind of the computer's simulation is the most
rewarding part of playing these games. This emergent behavior creates a joint
fantasy game that makes it feel just as realistic to me today as it did 35 years
ago when I barely understood the mechanics.

.. _`HAMURABI.BAS`: https://github.com/philspil66/Hamurabi/blob/main/hammurabi.bas
.. _`line 522`: https://github.com/philspil66/Hamurabi/blob/main/hammurabi.bas#L67
.. _`line 542`: https://github.com/philspil66/Hamurabi/blob/main/hammurabi.bas#L77
.. _`line 552`: https://github.com/philspil66/Hamurabi/blob/main/hammurabi.bas#L80
.. _`line 895`: https://github.com/philspil66/Hamurabi/blob/main/hammurabi.bas#L106
.. _`replica`: https://en.wikipedia.org/wiki/Replica_1#Third_edition
