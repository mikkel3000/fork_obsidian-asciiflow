## [v0.1.0]

### Added

- compact and wide buses (`5865183`)

  Draw straight horizontal or vertical double-line buses, choose rail spacing, and connect single-line branches. Saved diagrams appear as centered embeds with editing controls on hover or focus.
- a searchable figure catalog and smarter diagram editing (`b8f8bc1`)

  Browse and place 24 ready-made figures. Select labels and complete connectors,
  center labels inside boxes, and draw connectors following right-angle turns.

### Fixed

- canvas scaling and grid pixel alignment (`9618aa7`)

  Use the canvas window pixel ratio, refresh the backing bitmap when display density changes, and align grid lines to physical pixels. Click the zoom percentage to return to 100%.
- connector arrowheads, duplication, and Escape behavior (`b8f8bc1`)

  Arrowheads remain visible at box borders, duplicating preserves the original,
  and Escape resets the tool without closing the editor or asking to save.

### Patch

- Fix blurry canvas (`5127171`)
