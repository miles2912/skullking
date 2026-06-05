# Skull King Scorekeeper

A simple static browser app for scoring a 3- or 4-player Skull King game.

## Run

Open `index.html` in a browser.

No install step is required. The app currently uses the Tailwind CDN, so internet access is needed for the intended styling.

## Manual QA Checklist

- Open `index.html` and confirm the setup screen appears.
- Click `Help for Noobs`, then `Back to Game`.
- Start a 3-player game and confirm exactly 3 selected players are required.
- Start a 4-player game and confirm all 4 players are selected by default.
- Enter valid bid, tricks won, and bonus values, then advance to the next round.
- Enter tricks won that do not add up to the round number and confirm the Kraken prompt appears.
- Choose `No, go back` in the Kraken prompt and confirm the round remains editable.
- Choose `Yes` in the Kraken prompt and confirm the game advances.
- Use `Previous Round` and confirm prior round values are preserved.
- Refresh during a game and confirm the resume prompt appears.
- Resume the saved game and confirm the round and scores are preserved.
- Enter an invalid bid or tricks won value and confirm the app shows an error.
- Enter a negative or decimal bonus and confirm the app shows an error.
- Complete round 10 and confirm the final scores table appears.
- Click `Start New Game` and confirm saved state is cleared.
