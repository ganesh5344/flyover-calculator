# Cable-Stayed Flyover Calculator

A lightweight browser calculator for common preliminary structural formula checks.

## Features

- Calculate wind pressure, cable force, bending moment, shear force, average normal stress, dead load, and beam deflection.
- Review the eight most recent results while retaining the complete calculation log in the browser.
- Export the saved calculation log as a CSV spreadsheet, including formulas, input values, units, timestamps, and results.
- Switch between light and dark themes.
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

Calculation history is stored in the current browser's local storage and is not synchronized to GitHub or another device. Export the CSV to keep or share a copy.

## Safety note

This project is for learning and preliminary checks only. It does not account for all applicable load combinations, structural behavior, construction requirements, or design codes. Do not use its results for construction or safety decisions. Verify assumptions and calculations against applicable standards with a qualified structural engineer.
