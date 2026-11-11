# Cable-Stayed Flyover Project Workspace

A lightweight, browser-based workspace for organizing a flyover study. It combines an editable project brief, a design workflow checklist, and a set of preliminary structural formula calculators.

## Features

- Save a project name, site, structure type, design stage, span, and study notes in the current browser.
- Track study tasks with a locally saved checklist.
- Calculate wind pressure, cable force, bending moment, shear force, average normal stress, dead load, and beam deflection.
- Keep recent results in the browser, switch themes, print the overview, or export the saved brief and calculations as JSON.
- Use a responsive cable-stayed bridge illustration embedded directly in the page.

## Run locally

Open `index.html` in a modern browser. No package installation or server is required. Google Fonts are optional; the page uses system fallbacks if they cannot load.

## Calculator assumptions

Enter values using the units shown beside each field. The formulas are simplified educational checks, not a complete bridge-design method:

- Wind pressure: `P = 0.6 × V²`, with wind speed in m/s.
- Cable force: `H = wL² / (8d)`, using a parabolic cable approximation under uniform load.
- Bending moment: `M = wL² / 8`, for a simply supported beam with uniform load.
- Shear force: `V = wL / 2`, for a simply supported beam with uniform load.
- Average normal stress: `σ = P / A`.
- Dead load: `DL = γ × volume`.
- Beam deflection: `δ = 5wL⁴ / (384EI)`, for a simply supported beam with uniform load.

The project brief and checklist are stored in the browser's local storage; they are not synchronized to GitHub or another device. Use **Export brief** to download a JSON copy.

## Safety note

This project is for learning and preliminary checks only. It does not account for all applicable load combinations, structural behavior, construction requirements, or design codes. Do not use its results for construction or safety decisions. Verify assumptions and calculations against applicable standards with a qualified structural engineer.
