---
date: 2026-08-22T00:00:00-00:00
Categories:
    - Python
Tags:
    - SimCity
    - Strategy
    - Will Wright
    - Jay Wright Forrester
    - Mechanics
    - Finance
    - Politics

menu: main
title: A Perfect SimCity
---

After 35 years of playing SimCity, I still could not say what makes a "Perfect" city. An evaluation
screen displays a Score of 0 to 1000, and I struggled to reach 900 and never understood its factors.
Discovering these factors by play is the fun of a simulation game, and this one has the advantage
that the source code is also available.

`Don Hopkins`_ has been maintaining FOSS ports of `SimCity (1989)`_ as Micropolis_ and
MicropolisCore_, faithfully reproducing the ruleset of the original. Using the Python shims provided
by gym-city_ I have run many experiments and share these results here, presenting five high-scoring
and five high-population cities, designed algorithmically using the strategies shared below.

.. raw:: html

   <style>
     #simcity-embed {
       width: 100%;
       font-family: Menlo, Consolas, "DejaVu Sans Mono", monospace;
       margin-top: 1.5em; margin-bottom: 1.5em;
     }
     #simcity-embed .simcity-bar {
       display: flex; justify-content: space-between; align-items: baseline;
       background: #222; color: #ddd;
       padding: 2px 8px; font-size: 13px; line-height: 1.5;
     }
     #simcity-embed .simcity-bar span {
       white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
     }
     #simcity-embed #simcity-top {
       min-height: calc(3em + 4px);
     }
     /* The bottom bar is reference, not narration: it reads a size down from
        the top one, which keeps it short now that a phone splits it in three. */
     #simcity-embed #simcity-bottom { font-size: 11.5px; }
     @media (max-width: 700px) {
       #simcity-embed .simcity-bar { font-size: 11.5px; }
     }
     #simcity-embed #simcity-bottom-right-a { padding-right: 1.2em; }
     #simcity-embed #simcity-top-msg.simcity-msg-show {
       display: -webkit-box; -webkit-box-orient: vertical;
       -webkit-line-clamp: 2; line-clamp: 2;
       overflow: hidden; white-space: normal;
     }
     #simcity-embed .simcity-screen {
       position: relative; background: #000; border: 1px solid #444;
       display: flex; justify-content: center; align-items: center;
       min-height: 420px;
     }
     #simcity-embed canvas {
       display: block; width: 100%; height: auto;
       image-rendering: pixelated; image-rendering: crisp-edges;
       touch-action: manipulation;
     }
     #simcity-embed.simcity-fill canvas {
       width: auto; height: auto; max-width: 100%; max-height: 100%;
     }
     #simcity-embed.simcity-zoomed canvas {
       width: 100%; height: 100%; touch-action: none; cursor: grab;
     }
     #simcity-embed.simcity-zoomed canvas.simcity-grabbing { cursor: grabbing; }
     /* Every control floating over the map is sized from one place, so the
        zoom, VGA/EGA/Mono, sound, music and fullscreen buttons all tap alike.
        The top-right group is a flex row, and wraps to two rows on narrow
        screens rather than being packed by hand-counted pixel offsets. */
     #simcity-embed .simcity-topbar {
       position: absolute; top: 6px; right: 6px; z-index: 5;
       display: flex; justify-content: flex-end; gap: 4px;
       max-width: calc(100% - 94px);
     }
     #simcity-embed .simcity-modebar,
     #simcity-embed .simcity-iconbar {
       display: flex; justify-content: flex-end; gap: 4px;
     }
     #simcity-embed .simcity-setbar {
       position: absolute; bottom: 6px; right: 6px; z-index: 5;
       display: flex; flex-wrap: wrap; justify-content: flex-end;
       gap: 4px; max-width: calc(100% - 12px);
     }
     #simcity-embed .simcity-zoombar button,
     #simcity-embed .simcity-modebar button,
     #simcity-embed .simcity-setbar button,
     #simcity-embed .simcity-fscreen {
       box-sizing: border-box;
       display: inline-flex; align-items: center; justify-content: center;
       background: rgba(0, 0, 0, .55); color: #fff; border: 1px solid #666;
       border-radius: 3px; line-height: 1; cursor: pointer;
       min-height: 36px;
     }
     #simcity-embed .simcity-zoombar button:hover,
     #simcity-embed .simcity-modebar button:hover,
     #simcity-embed .simcity-setbar button:hover,
     #simcity-embed .simcity-fscreen:hover { background: rgba(0, 0, 0, .85); }
     #simcity-embed .simcity-zoombar button,
     #simcity-embed .simcity-fscreen {
       width: 36px; padding: 0; font-size: 16px;
     }
     #simcity-embed .simcity-modebar button {
       font-size: 13px; padding: 0 10px;
     }
     #simcity-embed .simcity-setbar button {
       font-size: 12px; padding: 0 10px; min-height: 32px;
     }
     #simcity-embed #simcity-music.simcity-fscreen:not(.simcity-sound-on) {
       text-decoration: line-through; color: #bbb;
     }
     #simcity-embed .simcity-modebar button.simcity-mode-active,
     #simcity-embed .simcity-setbar button.simcity-mode-active {
       background: rgba(40, 100, 170, .85); border-color: #8ac; font-weight: bold;
     }
     @media (max-width: 700px) {
       #simcity-embed .simcity-topbar {
         flex-direction: column; align-items: flex-end;
         max-width: calc(100% - 12px);
       }
       #simcity-embed .simcity-modebar { order: 1; }
       #simcity-embed .simcity-setbar button { font-size: 11px; padding: 0 8px; }
     }
     @media (pointer: coarse) {
       #simcity-embed .simcity-zoombar button,
       #simcity-embed .simcity-fscreen { width: 40px; }
       #simcity-embed .simcity-zoombar button,
       #simcity-embed .simcity-modebar button,
       #simcity-embed .simcity-fscreen { min-height: 40px; }
       #simcity-embed .simcity-setbar button { min-height: 36px; }
     }
     #simcity-embed .simcity-zoombar,
     #simcity-embed .simcity-topbar,
     #simcity-embed .simcity-setbar {
       transition: opacity .25s ease;
     }
     #simcity-embed.simcity-chrome-hidden .simcity-zoombar,
     #simcity-embed.simcity-chrome-hidden .simcity-topbar,
     #simcity-embed.simcity-chrome-hidden .simcity-setbar {
       opacity: 0; pointer-events: none;
     }
     /* In the article a touch device keeps the overlays up: there is no idle
        state to detect on a finger, and the map is small enough to spare the
        corners.  Fullscreen gives the map the whole screen, so there they fade
        like they do for a mouse, and any touch brings them back. */
     @media (pointer: coarse) {
       #simcity-embed.simcity-chrome-hidden:not(.simcity-in-fullscreen) .simcity-zoombar,
       #simcity-embed.simcity-chrome-hidden:not(.simcity-in-fullscreen) .simcity-topbar,
       #simcity-embed.simcity-chrome-hidden:not(.simcity-in-fullscreen) .simcity-setbar {
         opacity: 1; pointer-events: auto;
       }
     }
     #simcity-embed #simcity-sound.simcity-fscreen.simcity-sound-on,
     #simcity-embed #simcity-music.simcity-fscreen.simcity-sound-on {
       background: rgba(0, 110, 0, .75); border-color: #4a4;
     }
     #simcity-embed #simcity-sound.simcity-fscreen.simcity-sound-on:hover,
     #simcity-embed #simcity-music.simcity-fscreen.simcity-sound-on:hover {
       background: rgba(0, 140, 0, .85);
     }
     #simcity-embed .simcity-bar-group {
       display: flex; gap: 1em; align-items: baseline; min-width: 0;
     }
     #simcity-embed .simcity-msg { display: none; }
     #simcity-embed .simcity-msg.simcity-msg-show { display: inline; }
     #simcity-embed .simcity-msg.simcity-danger-msg {
       color: #f66; font-weight: bold;
     }
     #simcity-embed .simcity-zoombar {
       position: absolute; top: 6px; left: 6px; z-index: 5;
       display: flex; gap: 4px;
     }
     @media (pointer: coarse) {
       #simcity-embed input[type=range] { min-height: 26px; }
     }
     #simcity-embed .simcity-controls {
       display: flex; justify-content: space-between; align-items: center;
       flex-wrap: wrap; gap: .9em;
       background: #222; border: 1px solid #444; border-top: 0;
       padding: 6px 8px; font-size: 14px; color: #ddd;
     }
     /* One height across the row, so a button matches the select beside it. */
     #simcity-embed .simcity-controls button,
     #simcity-embed .simcity-controls select { min-height: 26px; }
     @media (max-width: 700px) {
       /* Two rows, each with a left end and a right end: speed left and tax
          right, then reload and disasters left and the city right.  The two
          pickers are the same width to the character, so their arrows line up
          down the right edge. */
       #simcity-embed .simcity-controls {
         justify-content: flex-start; gap: .5em;
       }
       #simcity-embed #simcity-reload { order: 3; }
       #simcity-embed #simcity-disaster { order: 4; }
       #simcity-embed .simcity-speedlabel {
         order: 1; width: calc(50% - .25em); justify-content: flex-start;
       }
       #simcity-embed .simcity-taxpick {
         order: 2; width: calc(50% - .25em); justify-content: flex-end;
       }
       #simcity-embed .simcity-citypick { order: 5; margin-left: auto; }
       #simcity-embed .simcity-bar {
         flex-direction: column; align-items: stretch;
       }
       #simcity-embed .simcity-bar span {
         white-space: normal; overflow: visible; text-overflow: clip;
       }
       /* Each census field group gets a row of its own and is held to it.  A
          row that rewraps changes the height of the bar, and in fullscreen the
          map is sized from whatever height the bars leave, so the map would
          resize every time a number gained a digit.  Truncating is the lesser
          evil: it costs a character, where reflowing moves the whole map. */
       #simcity-embed #simcity-bottom-right > span { display: block; }
       #simcity-embed #simcity-bottom span {
         white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
       }
     }
     #simcity-embed button, #simcity-embed input[type=range],
     #simcity-embed select {
       font: inherit; background: #333; color: #eee;
       border: 1px solid #666; border-radius: 3px; padding: 3px 10px;
       cursor: pointer; touch-action: manipulation;
     }
     #simcity-embed button:hover { background: #444; }
     #simcity-embed .simcity-danger { background: #a00; border-color: #d44; font-weight: bold; }
     #simcity-embed .simcity-danger:hover { background: #c00; }
     #simcity-embed select.simcity-danger {
       background: #a00; color: #fff; border-color: #d44; font-weight: bold;
     }
     #simcity-embed select.simcity-danger:hover { background: #c00; }
     #simcity-embed select.simcity-danger option {
       background: #222; color: #eee; font-weight: normal;
     }
     #simcity-embed .simcity-speedlabel { display: inline-flex; align-items: center; gap: 6px; }
     #simcity-embed input[type=range] { width: 140px; accent-color: #f80; padding: 0; }
     #simcity-embed .simcity-citypick,
     #simcity-embed .simcity-taxpick { display: inline-flex; align-items: center; gap: 4px; }
     #simcity-embed .simcity-citypick button,
     #simcity-embed .simcity-taxpick button { padding: 3px 8px; }
     #simcity-embed #simcity-cityname { min-width: 8em; text-align: center; color: #8f8; }
     #simcity-embed #simcity-taxrate { min-width: 4.5em; text-align: center; color: #8f8; }
     /* Phone: trim the row until Reload, Disasters and the city picker share
        one line.  Placed after the rules above so it wins the specificity tie
        rather than relying on source order elsewhere in the sheet. */
     @media (max-width: 700px) {
       #simcity-embed .simcity-controls { font-size: 12px; }
       #simcity-embed .simcity-controls button,
       #simcity-embed .simcity-controls select,
       #simcity-embed .simcity-citypick button,
       #simcity-embed .simcity-taxpick button {
         padding: 2px 6px; min-height: 22px;
       }
       /* Same width for both readouts, so the arrows either side of them line
          up between the two rows. */
       #simcity-embed #simcity-cityname,
       #simcity-embed #simcity-taxrate { min-width: 5.8em; }
     }
     #simcity-embed #simcity-status { color: #ff8; font-size: 13px; min-height: 1.3em; padding: 2px 8px; }
     #simcity-embed noscript { color: #f88; }
     .single-wrap .figure object,
     .single-wrap .figure img {
       display: block; width: 100%; height: auto; max-width: 100%;
       margin: 0 auto;
     }
     .single-wrap .figure > a { display: block; cursor: zoom-in; }
     .single-wrap .figure p.caption {
       font-family: "Open Sans", sans-serif; font-size: .78em;
       line-height: 1.5; color: #555; margin: .8em auto 0; max-width: 34em;
       text-align: center;
     }
     @media (max-width: 700px) {
       .single-wrap .figure > a::after {
         content: "tap to enlarge";
         display: block; text-align: center;
         font-family: "Open Sans", sans-serif; font-size: .7em;
         color: #7b68ee; margin-top: .4em;
       }
     }

     .single-wrap table.docutils {
       display: block; overflow-x: auto; -webkit-overflow-scrolling: touch;
       max-width: 100%; width: max-content;
       border-collapse: collapse; border: 0;
       margin: 2em auto; font-family: "Open Sans", sans-serif; font-size: .8em;
     }
     .single-wrap table.docutils col { width: auto; }
     .single-wrap table.docutils th,
     .single-wrap table.docutils td {
       padding: .35em .7em; white-space: nowrap;
       border: 1px solid #e0e1e6; text-align: left;
     }
     .single-wrap table.docutils th { background: #fafafa; font-weight: 700; }
     .single-wrap table.docutils tbody tr:nth-child(even) { background: #fcfcfc; }

     #simcity-embed:fullscreen {
       width: 100vw; height: 100vh; display: flex; flex-direction: column;
       background: #000; overflow: auto; margin: 0;
     }
     #simcity-embed:fullscreen .simcity-screen { flex: 1; min-height: 0; }
     #simcity-embed:fullscreen #simcity-status { display: none; }
     #simcity-embed:fullscreen .simcity-bar { padding: 1px 8px; }
     #simcity-embed:fullscreen .simcity-controls { padding: 3px 8px; }
     #simcity-embed.simcity-pseudo-fullscreen {
       position: fixed; inset: 0; z-index: 9999;
       width: 100vw; height: 100vh;
       height: 100dvh;
       display: flex; flex-direction: column;
       background: #000; overflow: auto; margin: 0;
       padding-bottom: env(safe-area-inset-bottom);
     }
     #simcity-embed.simcity-pseudo-fullscreen .simcity-screen {
       flex: 1; min-height: 0;
     }
     #simcity-embed.simcity-pseudo-fullscreen #simcity-status { display: none; }
     #simcity-embed.simcity-pseudo-fullscreen .simcity-bar { padding: 1px 8px; }
     #simcity-embed.simcity-pseudo-fullscreen .simcity-controls { padding: 3px 8px; }
     /* The pinned embed covers the viewport, but iOS paints the strips behind
        its own toolbars from the page underneath, so a white article shows
        through at top and bottom.  Black the page for the duration, and stop
        the rubber-band that would reveal it anyway. */
     html.simcity-fullscreen-lock,
     html.simcity-fullscreen-lock body {
       overflow: hidden; background: #000; overscroll-behavior: none;
     }
   </style>

   <figure>
   <div id="simcity-embed">
     <div class="simcity-bar" id="simcity-top">
       <span class="simcity-bar-group">
         <span id="simcity-top-left"></span>
         <span id="simcity-top-msg" class="simcity-msg"></span>
       </span>
     </div>
     <div class="simcity-screen" id="simcity-screen">
       <canvas id="simcity-canvas"></canvas>
       <div class="simcity-zoombar">
         <button id="simcity-zoomout" type="button" title="Zoom out">-</button>
         <button id="simcity-zoomin" type="button" title="Zoom in">+</button>
       </div>
       <div class="simcity-topbar">
         <div class="simcity-modebar" id="simcity-modebar">
           <button type="button" data-mode="vga" title="256-color VGA/MCGA tiles (8x8)">VGA</button>
           <button type="button" data-mode="ega" class="simcity-mode-active" title="Hires EGA tiles (16x16)">EGA</button>
           <button type="button" data-mode="mono" title="Hercules/mono tiles (16x16)">Mono</button>
         </div>
         <div class="simcity-iconbar">
           <button id="simcity-music" class="simcity-fscreen" type="button"
                   title="Music off">&#x266B;</button>
           <button id="simcity-sound" class="simcity-fscreen" type="button"
                   title="Sound effects off">&#x1F507;</button>
           <button id="simcity-fullscreen" class="simcity-fscreen" type="button"
                   title="Fullscreen">&#x26F6;</button>
         </div>
       </div>
       <div class="simcity-setbar" id="simcity-setbar">
         <button type="button" data-set="classic" class="simcity-mode-active"
                 title="The original SimCity tiles and sprites">Classic</button>
         <button type="button" data-set="asia" title="Ancient Asia graphics set">Ancient Asia</button>
         <button type="button" data-set="feur" title="Future Europe graphics set">Future Europe</button>
         <button type="button" data-set="fusa" title="Future USA graphics set">Future USA</button>
         <button type="button" data-set="medi" title="Medieval Times graphics set">Medieval</button>
         <button type="button" data-set="moon" title="Moon Colony graphics set">Moon Colony</button>
         <button type="button" data-set="west" title="Wild West graphics set">Wild West</button>
       </div>
     </div>
     <div class="simcity-bar" id="simcity-bottom">
       <span id="simcity-bottom-left"></span><span id="simcity-bottom-right"><span
         id="simcity-bottom-right-a"></span><span id="simcity-bottom-right-b"></span></span>
     </div>
     <div class="simcity-controls">
       <span class="simcity-taxpick" title="Tax Rate">
         <button id="simcity-taxdown" type="button" title="Lower the tax rate">&#9664;</button>
         <span id="simcity-taxrate"></span>
         <button id="simcity-taxup" type="button" title="Raise the tax rate">&#9654;</button>
       </span>
       <label class="simcity-speedlabel" title="Simulation speed: 0 pauses">
         Speed
         <input type="range" id="simcity-speed" min="0" max="8" step="1" value="1">
       </label>
       <button id="simcity-reload" type="button" title="Reload the current city">Reload</button>
       <select id="simcity-disaster" class="simcity-danger" title="Enable, disable, or select Disaster">
         <option value="auto" selected>Disasters</option>
         <option value="off">No Disasters</option>
         <option value="earthquake">Earthquake</option>
         <option value="fire">Fire</option>
         <option value="flood">Flood</option>
         <option value="tornado">Tornado</option>
         <option value="monster">Monster</option>
         <option value="meltdown">Meltdown</option>
         <option value="firebombs">Fire Bombs</option>
       </select>
       <span class="simcity-citypick">
         <button id="simcity-prev" type="button" title="Previous city">&#9664;</button>
         <span id="simcity-cityname"></span>
         <button id="simcity-next" type="button" title="Next city">&#9654;</button>
       </span>
     </div>
     <div id="simcity-status"></div>
     <noscript>This article embeds a runnable Micropolis simulation and needs JavaScript.</noscript>
   </div>

   <script type="module" src="./simcity-embed.js"></script>

   <figcaption>Figure 1. Ten algorithmically generated cities, 5 with highest score (bigscore1
   through 5), and 5 for large population of 700k (bigpop1 through 5).</figcaption>
   </figure>

Citizens Demand Fewer Roads
---------------------------

The population of a perfectly scoring city is 12-16k.  Their population level, crime rate, pollution
and land value are perfectly balanced to sustain a 1% Tax Rate.  Their roads and rails are few and
non-contiguous.  A perfectly scoring city is without any fire department, and ``bigscore2`` through
``5`` have no police station.

=========  =====  ==========  =====  =========  ==========  ============  ===========
city       score  population  crime  pollution  land value  unemployment  cash / year
=========  =====  ==========  =====  =========  ==========  ============  ===========
bigscore1  949.5  16,560      13     36         126         -93           +6
bigscore2  940.0  18,400      22     41         124         -99           +147
bigscore3  940.0  12,440      22     35         122         -96           +93
bigscore4  939.0  12,400      16     30         128         -95           +86
bigscore5  937.0  14,640      20     41         127         -98           +117
=========  =====  ==========  =====  =========  ==========  ============  ===========

Travel requirements of residential and industrial zones are simple.  They check their twelve
surrounding tiles for any road or rail to decide if it should grow.  If none is there, the zone
declines.

Commercial zones require a delivery, a vehicle starts on the perimeter road and walks up to 30
steps, arriving the moment it stands beside a developed tile. *The zone's own tiles count*, so any
loop of track under 30 steps satisfies it.  Commercial zones are placed in the city center because
the engine provides a *downtown bonus*, starting at +64 and falling off to a -64 penalty in the far
corners of the map.

The `PC SimCity manual`_ recommends rails and it is the most obvious strategy that players discover
on their own. Roads carry traffic and emit pollution, which suppresses residential growth.  Rails
emit no pollution and register no traffic at all.

Roads and rails incur an annual cost, and Police and Fire are very large budget items, they severely
impact score if they are under-funded and so must be at 100% funding.  Having neither departments is
the lowest annual cost allowing for the lowest Tax Rate. Raising the Tax Rate to 2% lowers the score
almost 30 points, through direct and indirect factors.

Citizens Demand More Citizens
-----------------------------

In the `Super Nintendo edition`_ the game rewards *population*, the final reward of Megapolis is issued
at a population of 500k. Casual players report cities of 600k to 700k on the SNES platform, with `one
player reporting 911.2k`_.

911.2k is probably out of reach for Micropolis_.  The Super Nintendo is the only edition to offer
gifts_, which increase land value when placed, allowing for higher zone density in the areas outside
of the *downtown bonus*.

I have also experimented with optimizing for population by algorithm, and I am able to reach 700k by
automatic code.

=======  ==========  =====  ===  =====  =========  ===========
city     population  score  tax  crime  pollution  cash / year
=======  ==========  =====  ===  =====  =========  ===========
bigpop1  709,405     467.0  2%   140    174        +2,206
bigpop2  694,670     468.5  5%   175    179        +7,944
bigpop3  688,435     458.5  5%   218    171        +7,568
bigpop4  682,590     525.0  2%   116    168        +470
bigpop5  670,950     461.5  3%   219    171        +4,194
=======  ==========  =====  ===  =====  =========  ===========

Citizens Demand More Housing
----------------------------

Score is calculated in two stages, the first uses seven penalty terms:

- crime, the citywide crime average
- pollution, the citywide pollution average
- housing, the citywide land value average
- taxes, the tax rate
- traffic, the citywide traffic average
- unemployment
- fire, the tiles burning at that moment

.. figure:: /images/simcity-score-terms.svg
   :target: /images/simcity-score-terms.svg
   :align: center

   *Figure 2. The seven scoring terms. Six are bounded at zero and can only subtract, and traffic
   can be as high as 576. Unemployment has no lower bound, a negative value raises score.*

Six out of seven terms are bounded at zero. However, unemployment is unbounded::

    unemployment = (resPop / (8 * jobs) - 1) * 255

When the number of jobs exceeds the residents zoned to fill them, **The Unemployment term goes
negative and adds to the score**, providing a score bonus of about 128 points. No other term moves
the score this much.

The second stage of score calculation is reduction by nine more penalties:

.. figure:: /images/simcity-score-stage2.svg
   :target: /images/simcity-score-stage2.svg
   :align: center

   *Figure 3. Each penalty applies to what the one above it left, so the same factor is worth less
   further down the list. The right-hand column is what each costs a city scoring 940.*

The first three are penalties for failing to build a special zone. Surpassing 500 residents demands
a stadium, 100 commercial an airport and 70 industrial a seaport. Where a stadium is placed does not
matter to score, having no traffic or pollution. However, Airports and Seaports do reduce overall
score, because of their high-density pollution and so they are not built.

Citizens Demand Fountains
-------------------------

Each of those seven penalty terms is an average, and the `land value scan.cpp`_ decides what is
included by each 2x2 square of map by their tile ID. Grass, forest and park trees are under 64 and
invisible to scoring, but **a fountain of ID 840 includes it for grading, even though nobody lives
in it!**

These 2x2 squares otherwise carry no population, pulling down the crime penalty term by 33 points.

=======  ===================  ==========  =======
tile id  tile                 land value  counted
=======  ===================  ==========  =======
0        dirt                 no          no
...      ...                  ...         ...
2-20     water                +15         no
21-43    forest, park trees   +15         no
44-63    rubble, flood, fire  no          no
64-65    bridge               no          yes
66-79    road                 no          yes
...      ...                  ...         ...
840      park fountain        **no**      **yes**
=======  ===================  ==========  =======

*Figure 5. A 2x2 square is counted only when it contains tile ID 64 or greater, while land value is
credited only from tile IDs below 44.  The park building tool has a one in five chance to draw a
fountain, ID 840. Placing fountains lower total crime penalty.*

Park Overflow
-------------

Many guides recommend parks to reduce or absorb pollution, but they do not reduce pollution at
all in Micropolis_.  However, pollution reduces land value, and land value drives crime, so parks
lower crime indirectly by raising the land value around them.

Water, park and tree tiles all increase land value, and the engine counts them in 4x4 blocks. Every
such tile credits its block 15 points, and the final credit to land value is this sum, plus downtown
bonus, minus pollution.

However, this land value credit is kept as a single byte, and `smoothTerrain() in scan.cpp`_ blends
a block with its neighbors before it divides, so a block with its surroundings may sum *beyond 255
and wrap around*, counter-intuitively lowering land value.

.. figure:: /images/simcity-park-overflow.svg
   :target: /images/simcity-park-overflow.svg
   :align: center

   *Figure 4. Number of Water, park or tree tiles in a 4x4 block against the land value it credits.
   Exactly 1/2 of the tiles (8) is the optimal value of greenery. At 9 of 16 tiles, it is in
   danger of driving down land value when summed with its neighbors.*

The `PC SimCity manual`_ declares that "Parks, like forests and water, raise the land value of
surrounding zones".  However, **too many parks or trees can push push down land value and increase
crime.**

Citizens Demand More Industries
-------------------------------

Common strategy is to lay industrial zones by map edges, and this is recommended to maximize for
population. The `SNES SimCity manual`_ writes, "One of the great benefits of building industrial
Zones along the edges is that half the pollution is off the map and doesn't affect the city.  This
is very important when it comes to heavily polluting industries, Airports and Coal Power Stations."

This is partly true.  The Micropolis_ engine spreads pollution outward from each source, divides the
map into 4x4 blocks, and then creates an average of only the blocks that contain pollution::

    pollutionAverage = ptot / pnum

- ``ptot`` is the pollution totaled over the dirty blocks
- ``pnum`` is the count of those blocks

Tiles that contain low levels of pollution help bring down total pollution by this averaging, a
small high-scoring city should keep the light density pollution for itself. Models suggest that a
city maximized for population should place industrial zones on map edges for other reasons, that the
land value there is too low to for other kind of zones.

Citizens Demand Humanity
------------------------

Jay Wright Forrester's `Urban Dynamics`_ (1969) is often cited as an influence on Will Wright, Chief
Designer of `SimCity (1989)`_. *Urban Dynamics* is essentially a paperback simulation of cities.
The Micropolis_ simulation is vaguely recognizable as a minified version of the model in *Urban
Dynamics* along with some small improvements in including spatial values of neighboring tiles that
Forrester's models lack. Interestingly, both arrive at the same place: what improves a city
most is *reducing* available housing:

    The concurrent reduction of excess housing is absolutely essential. It supplies the land for new
    job-creating structures. Equally important, the resulting housing shortage creates the
    population-stabilizing pressure that allows economic revival to proceed without being inundated
    by rising population.

    -- Jay Forrester, `Counterintuitive Behavior of Social Systems`_, 1971

`The Sumerian Game (1963)`_, considered the antecedent of the city-building game genre, contains
the same anti-pattern, where `I found the best strategy`_ is systemic starvation of 3% of the
population.  I think in 2026 it would be difficult to find a proponent for the housing and
population shortages that all three of these models suggest optimizing towards.

.. _`Counterintuitive Behavior of Social Systems`: https://ocw.mit.edu/courses/15-988-system-dynamics-self-study-fall-1998-spring-1999/65cdf0faf132dec7ec75e91f9651b31f_behavior.pdf
.. _`Don Hopkins`: https://donhopkins.medium.com/
.. _gifts: https://gamefaqs.gamespot.com/snes/588657-simcity/faqs/68878#section2
.. _gym-city: https://github.com/smearle/gym-city
.. _`I found the best strategy`: https://www.jeffquast.com/post/hamurabi_bas/
.. _MicropolisCore: https://github.com/SimHacker/MicropolisCore
.. _Micropolis: https://github.com/SimHacker/micropolis
.. _`one player reporting 911.2k`: https://gamefaqs.gamespot.com/boards/588657-simcity/79143601
.. _`PC SimCity manual`: https://archive.org/details/simcity_ibm_manual
.. _`SimCity (1989)`: https://archive.org/details/msdos_SimCity_1989
.. _`smoothTerrain() in scan.cpp`: https://github.com/SimHacker/MicropolisCore/blob/6811ae03b419949650e782331021cbb1f16a5486/packages/micropolis-engine/src/scan.cpp#L503
.. _`SNES SimCity manual`: https://archive.org/details/sim-city-usa
.. _`Super Nintendo edition`: https://en.wikipedia.org/wiki/SimCity_(1989_video_game)#Super_NES
.. _`land value scan.cpp`: https://github.com/SimHacker/MicropolisCore/blob/6811ae03b419949650e782331021cbb1f16a5486/packages/micropolis-engine/src/scan.cpp#L274
.. _`The Sumerian Game (1963)`: https://en.wikipedia.org/wiki/The_Sumerian_Game
.. _`Urban Dynamics`: https://archive.org/details/urbandynamics0000forr
