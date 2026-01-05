# Track Specification: Core ShadowRunner Environment

## Overview
This track focuses on establishing the foundational environment for ShadowRunner, including the project scaffolding, mapping engine integration, and the core "Relentless" survival logic.

## Objectives
- Initialize a React + Vite (TypeScript) project.
- Integrate MapLibre GL JS with a full-screen dark tactical style.
- Implement real-time GPS tracking and a HUD overlay.
- Develop the "Relentless" Shadow movement algorithm.

## Technical Requirements
- **Framework:** React 18+, Vite.
- **Maps:** MapLibre GL JS.
- **Geospatial:** Turf.js.
- **State:** Zustand.
- **Styling:** Tailwind CSS.

## User Stories
- "As a runner, I want to see a map revealed as I move so I can feel like I'm exploring."
- "As a runner, I want to be alerted when the Shadow is close so I can feel the pressure to move faster."
- "As a runner, I want a clear target location and direction so I know where to 'escape'."

## Acceptance Criteria
- Project starts and renders a dark map.
- Map centers on the user's real-time GPS coordinates.
- A HUD displays distance to a target and Shadow threat level.
- The "Shadow" distance decreases at a constant rate (6:00 min/km equivalent) relative to the user's progress.
