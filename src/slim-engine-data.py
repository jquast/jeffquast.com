#!/usr/bin/env python3
"""Split the engine's preloaded city archive into on-demand files.

MicropolisCore builds micropolisengine.data as one Emscripten preload package
Usage:
  slim-engine-data.py [BUNDLE_DIR]
"""

import json
import re
import sys
from pathlib import Path

DEFAULT_DIR = Path(__file__).resolve().parents[1] / "content/post/a-perfect-simcity"
# One city is left in the preload package as a boot city.  Nothing opens it:
# the embed's CITIES list (bigscore1-5, bigpop1-5) is published from the
# perfect-city repo into cities/ and fetched on demand.  The package is kept at
# one file because that is what creates /cities in the engine's filesystem, and
# because a zero-file package is not a shape the loader is known to accept.
#
# Which city it is does not matter, so take whichever comes first rather than
# naming one: the fat package comes from MicropolisCore and its contents are
# not ours to depend on.
# Cities to extract from a FAT package into cities/.  Empty: the published set
# no longer comes from the engine bundle, so everything else in a fat package
# is stock content the embed never opens.
KEEP = set()

METADATA = re.compile(r'loadPackage\((\{"files":.*?"remote_package_size": \d+\})\);', re.S)


def main():
    d = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_DIR
    js_path, data_path = d / "micropolisengine.js", d / "micropolisengine.data"
    js, data = js_path.read_text(), data_path.read_bytes()

    match = METADATA.search(js)
    if not match:
        sys.exit(f"{js_path}: preload metadata literal not found")
    meta = json.loads(match.group(1))
    if len(meta["files"]) != len(data) // 27120 or meta["remote_package_size"] != len(data):
        sys.exit(f"{data_path}: size {len(data)} disagrees with the metadata")
    if len(meta["files"]) == 1:
        print(f"already slim ({meta['files'][0]['filename']}), nothing to do")
        return

    cities = d / "cities"
    cities.mkdir(exist_ok=True)
    written = skipped = 0
    for entry in meta["files"]:
        name = entry["filename"].rsplit("/", 1)[-1]
        if name not in KEEP:
            skipped += 1
            continue
        (cities / name).write_bytes(data[entry["start"]:entry["end"]])
        written += 1

    first = meta["files"][0]
    boot_name = first["filename"].rsplit("/", 1)[-1]
    boot = data[first["start"]:first["end"]]
    kept = {"files": [{"filename": "/cities/" + boot_name, "start": 0,
                       "end": len(boot)}],
            "remote_package_size": len(boot)}
    js_path.write_text(js.replace(match.group(1), json.dumps(kept), 1))
    data_path.write_bytes(boot)

    print(f"  cities/            {written} files, {written * 27120} B "
          f"(fetched on demand; {skipped} stock cities dropped)")
    print(f"  boot city          {boot_name} ({len(boot)} B, never opened)")
    print(f"  micropolisengine.data  {len(data)} -> {len(boot)} B")


if __name__ == "__main__":
    main()
