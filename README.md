# SpanLab Flyover Calculator

A lightweight browser workspace for exploring common preliminary cable-stayed flyover formulas.

## Pages

- `index.html` — home page with links to the calculator and saved work.
- `calculator.html` — grouped load and structural-response formulas.
- `history.html` — searchable calculation history with CSV export.

## Features

- Calculate wind pressure, cable force, bending moment, shear force, average normal stress, dead load, and beam deflection.
- Review every saved calculation, filter by formula, and export timestamps, formulas, inputs, units, and results as CSV.
- Share calculation history and theme preference between pages in the same browser.
- Responsive layouts and an embedded cable-stayed bridge illustration.

## Run locally

Open `index.html` in a modern browser. No package installation or server is required. Google Fonts are optional; the page uses system fallbacks if they cannot load.

## Calculator assumptions

Enter values using the units shown beside each field. These formulas are simplified educational checks, not a complete bridge-design method:

- Wind pressure: `P = 0.6 × V²`, with wind speed in m/s.
- Cable force: `H = wL² / (8d)`, using a parabolic cable approximation under uniform load.
- Bending moment: `M = wL² / 8`, for a simply supported beam with uniform load.
- Shear force: `V = wL / 2`, for a simply supported beam with uniform load.
- Average normal stress: `σ = P / A`.
- Dead load: `DL = γ × volume`.
- Beam deflection: `δ = 5wL⁴ / (384EI)`, for a simply supported beam with uniform load.

Calculation history is stored in this browser's local storage. It is not synchronized to GitHub or another device. CSV exports are downloaded to the browser's Downloads folder.

## Safety note

This project is for learning and preliminary checks only. It does not account for all applicable load combinations, structural behavior, construction requirements, or design codes. Do not use its results for construction or safety decisions. Verify assumptions and calculations against applicable standards with a qualified structural engineer.
