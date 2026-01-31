---
Categories:
    - Python
Tags:
    - Ultima
    - Terminal
    - Graphics
    - Tiles

date: 2024-02-12T00:00:00-00:00
menu: main
title: Ultima IV rewrite using Terminal Graphics
---

Ultima IV
=========

This past year, I restored an Apple ][e computer. One of the most iconic games
for Apple ][ is `Ultima IV`_, the fourth game of the Ultima series by `Richard
Garriott`_, who has an interesting story himself to say the least.

The most interesting aspect of `Ultima IV`_ is that the goal is directed
internally to the character that you play. Instead of a typical "defeat this
final boss" story, you must instead master the `Eight Virtues`_ for your
character. There is a set of variables that track your character's actions, and
the world presents eight matching towns, shrines, and dungeons that represent
each virtue: Honesty, Compassion, Valor, Justice, Sacrifice, Honor,
Spirituality, and Humility.

Upon completion of the game, the character achieves enlightenment and becomes
the "Avatar". This very game popularized the use of this Hindi word in Western
culture for video games and movies.

I enjoyed the game so very much that I learned how to decode the data files, and
began writing my own engine, here is a brief summary of my work. There exists
a document about the `Ultima IV data files`_

Qwack
=====

I wrote Qwack_, a "quickly written Hack_ (1985) variant in Python" in 2015,
offline during a power outage with the hours of battery available on a laptop.

I had just read `Game Programming Patterns`_ (2019, Robert Nystrom) and applied
what I learned to make this engine.

Qwack_ is different than most Hack variants in that is a fully 3D Voxel engine,
like Dwarf Fortress.

.. raw:: html

   <script async id="asciicast-40162" src="https://asciinema.org/a/40162.js"></script>


After playing Ultima IV, I thought to return to this engine, and to improve it
with assets from the Ultima IV game data files, so that I could make some
experiments that are not possible on the Apple ][ or very difficult to do with
machine code and the limited RAM.

.. raw:: html

   <script async id="asciicast-BTV1oh9z2ZTtTzbNNPUNRCMXj" src="https://asciinema.org/a/BTV1oh9z2ZTtTzbNNPUNRCMXj.js"></script>


The structure of Qwack_ was already very accommodating to modify for a
tile-based engine with Ultima IV assets, it is broken into three classes: 

- World_, as a collection of *Items* that make up the game. Each item has a
  coordinate and material, allowing the world to be manipulated, such as in
  Minecraft.

- Viewport_, representing the visible portion of the world, this handles
  transformation of World Item coordinates to screen coordinates and
  line-of-sight calculations.

- UInterface_ manages keyboard input, screen resize calculations, and the
  meta-terminal

Tile-based engines
==================

I used the chafa_ library to create "ansi graphics" from the PC-DOS EGA files.

.. image:: https://raw.githubusercontent.com/hpjansson/chafa/master/docs/chafa-logo.gif

The python wrapper eventually results in segfault, so execution is delegated to
a subprocess of the CLI application as a workaround.

The results are then "memoized" through a zipfile. By pre-calculating tiles and
their combinations, the zipfile can be pre-poulated without requiring libchafa to
be installed at runtime. 

Then, it is simply a matter of displaying tiles instead of individual
characters,

.. raw:: html

    <video controls="controls" width="800" height="600" name="My First tile engine">
      <source src="https://www.jeffquast.com/u4demo.mov">
    </video>

This rapidly transformed the graphics from a "traditional rogue-like" to a very
good facsimile of EGA graphics.

Then, I used a fan project by `Joshua Steele`_ of alternative VGA graphics
tilesets for `Ultima IV`_ which look much better than the graphics derived from
the Apple ][.

.. raw:: html

    <video controls="controls" width="800" height="600" name="Tiles engine with VGA graphics">
      <source src="https://www.jeffquast.com/u4demo2.mov">
    </video>

FOV & Dithering
===============

A FOV_ algorithm from Qwack_ is re-enabled,

- https://github.com/jquast/qwack/blob/09b46faf02a40ba9d1ea963d272322cb9f8f1f77/qwack/main.py#L1013

And, a "darkness" attribute is added to World Items, so that it is not possible to
see through heavy forest or around walls.  A simple "darkness" setting is
applied by basic dithering,


.. raw:: html

    <video controls="controls" width="800" height="600" name="Darkness effect">
      <source src="https://www.jeffquast.com/u4demo3.mov">
    </video>

- https://github.com/jquast/qwack/blob/09b46faf02a40ba9d1ea963d272322cb9f8f1f77/qwack/u4_tiler.py#L60-L99

Also displayed, is using chafa_ to provide tile resizing, so that we are not
necessarily constrained to the 16x16 pixel to -> 8x6 utf-8 block art, a very
reasonable representation can be provided for just about any screen size.

Candlelight effect
==================

My favorite effect is this one, which I call the "candlelight effect"

.. code-block:: python

    distance = item.distance(player_pos)
    # 1/24 chance of 'rounding error' of distance provides "candlelight effect"
    fn_trim = math.ceil if not random.randrange(24) else math.floor
    return fn_trim(min(max(0, (world_darkness - 2) + distance), MAX_DARKNESS))

- https://github.com/jquast/qwack/blob/09b46faf02a40ba9d1ea963d272322cb9f8f1f77/qwack/u4_tiler.py#L213-L215

This animates a subtle flickering effect of the items that surround the player,
giving the appearance of using a torch or candle

.. raw:: html

    <video controls="controls" width="800" height="600" name="Candlelight effect">
      <source src="https://www.jeffquast.com/u4demo6.mov">
    </video>


Meta-Terminal
=============

Using utf-8 block art for high resolution terminal graphics has one drawback:
resizing for the best screen dimensions and font size makes the text small
and unreadable.

However, we can extract the IBM-PC DOS character sets and use chafa_ to also
render the text with utf-8 block art! We create function `make_character_tile`_
as a wrapper of method `make_ansi_tile` to make "Joe's own terminal emulator",
with interactive input, backspacing, and carriage return controls to allow
talking to NPC's, complete with custom "spinner" cursor,

.. raw:: html

    <video controls="controls" width="800" height="600" name="Game Engine with Terminal">
      <source src="https://www.jeffquast.com/u4demo7.mov">
    </video>

Animated Water and Fields
=========================

Also displayed here is "animated water". Using the same basic maths from the
original, we calculate a "y_offset" value to be incremented at each game tick,

.. code-block:: python

    if items[0].is_field:
        y_offset_fg = items[0].get_y_offset(tick=int(time.monotonic() * 4))
    if items[-1].is_water:
        if bg_tile_id is not None:
            y_offset_bg = items[-1].get_y_offset(tick=int(time.monotonic() * 4))
        else:
            y_offset_fg = items[-1].get_y_offset(tick=int(time.monotonic() * 4))

    ...

    def get_y_offset(self, tick):
        if self.tile_id in (0, 1, 2, 68, 69, 70, 71):
            return tick % 16
        return 0

And, using the modulus operator (``%``) create a function to apply any given
"offset" on a PIL Image object,

.. code-block:: python

    def apply_offsets(ref_image, x_offset, y_offset):
        if ref_image and (x_offset or y_offset):
            tmp_img = PIL.Image.new(ref_image.mode, ref_image.size)
            for y in range(tmp_img.size[1]):
                new_y = (y + y_offset) % tmp_img.size[1]
                for x in range(tmp_img.size[0]):
                    new_x = (x + x_offset) % tmp_img.size[0]
                    tmp_img.putpixel((new_x, new_y), ref_image.getpixel((x, y)))
            return tmp_img
        return ref_image

https://github.com/jquast/qwack/blob/09b46faf02a40ba9d1ea963d272322cb9f8f1f77/qwack/main.py#L791-L808


Spellcasting & Confusion
========================

When casting a spell in Ultima IV, the graphics on the screen are inverted in
unnatural colors by inversion of RGB colorspace, basic enough:

.. code-block:: python

    def apply_inverse(ref_image):
        if ref_image:
            # sets all pixels to their inverted color (spell effects)
            tmp_image = PIL.Image.new(ref_image.mode, ref_image.size)
            for y in range(ref_image.size[1]):
                for x in range(ref_image.size[0]):
                    r, g, b, a = ref_image.getpixel((x, y))
                    tmp_image.putpixel((x, y), (255 - r, 255 - g, 255 - b, a))
            return tmp_image
        return ref_image

- https://github.com/jquast/qwack/blob/09b46faf02a40ba9d1ea963d272322cb9f8f1f77/qwack/u4_tiler.py#L112-L121

Using the existing functions used to animated water and fields, I have created a
new unique effect, "confusion" by randomizing the x and y offsets as a "sum of
four random values between -1 and 1", giving something of a bell curve
distribution of values,

.. code-block:: python

        if confusion:
            if len(items) > 1:
                y_offset_bg += sum((random.randrange(-1, 1), random.randrange(-1, 1),
                                    random.randrange(-1, 1), random.randrange(-1, 1)))
                x_offset_bg += sum((random.randrange(-1, 1), random.randrange(-1, 1),
                                    random.randrange(-1, 1), random.randrange(-1, 1)))
            else:
                y_offset_fg += sum((random.randrange(-1, 1), random.randrange(-1, 1),
                                    random.randrange(-1, 1), random.randrange(-1, 1)))
                x_offset_fg += sum((random.randrange(-1, 1), random.randrange(-1, 1),
                                    random.randrange(-1, 1), random.randrange(-1, 1)))


.. raw:: html

    <video controls="controls" width="800" height="600" name="Spellcasting">
      <source src="https://www.jeffquast.com/u4demo8.mov">
    </video>


Conclusion
==========

That's it!  You can play this game with python 3 using commands:

.. code::

    pip install git+https://github.com/jquast/qwack.git
    qwack

Be sure to use a large terminal size, eg. 400 columns by 120 lines.

I won't be using any of the `Ultima IV`_ assets, as I'm sure Electronic Arts
would take offense (even though the game is `distributed for free
<https://www.gog.com/en/game/ultima_4>`_), but thanks to the free tileset
released by `Joshua Steele`_ to the public domain to bootstrap tiles graphics,
and the GPLv3 license of chafa_, I have the ability to distribute an open-source
rogue-like through Steam by bundling it with any UTF-8 capable terminal emulator
for each platform. But what I'm most excited about is the use of the python
language, which should allow young developers to manipulate the game engine
without any special IDE and compiler.

.. _`Game Programming Patterns`: https://gameprogrammingpatterns.com/
.. _`Joshua Steele`: https://github.com/jahshuwaa/u4graphics
.. _FOV: https://www.roguebasin.com/index.php/Field_of_Vision
.. _Qwack: https://www.github.com/jquast/qwack
.. _`make_character_tile`: https://github.com/jquast/qwack/blob/09b46faf02a40ba9d1ea963d272322cb9f8f1f77/qwack/u4_tiler.py#L217-L227
.. _chafa: https://github.com/hpjansson/chafa
.. _`Ultima IV`: https://en.wikipedia.org/wiki/Ultima_IV:_Quest_of_the_Avatar
.. _`Hack`: https://en.wikipedia.org/wiki/Hack_(video_game)
.. _`Eight Virtues`: https://wiki.ultimacodex.com/wiki/Eight_Virtues
.. _`Richard Garriott`: https://en.wikipedia.org/wiki/Richard_Garriott
.. _`Ultima IV data files`: https://wiki.ultimacodex.com/wiki/Ultima_IV_internal_formats
.. _`World`: https://github.com/jquast/qwack/blob/09b46faf02a40ba9d1ea963d272322cb9f8f1f77/qwack/main.py#L73-L76
.. _`Viewport`: https://github.com/jquast/qwack/blob/09b46faf02a40ba9d1ea963d272322cb9f8f1f77/qwack/main.py#L916-L921
.. _`UInterface`: https://github.com/jquast/qwack/blob/09b46faf02a40ba9d1ea963d272322cb9f8f1f77/qwack/main.py#L493
