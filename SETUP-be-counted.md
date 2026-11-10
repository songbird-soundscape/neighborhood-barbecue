# Setting up "Be counted" for Neighborhood Barbecue

Same two doors as Two-Stroke Morning:

1. **Share my answers anonymously** opens a form. No name, no email.
2. **Sign up for updates** opens the lab's mailing-list sign-up.

Keep them separate and never match one against the other. That is the promise the page makes.

Both buttons say "coming soon" until the links are pasted into `COUNT_CFG` in `index.html` (search for `COUNT_CFG`), or sent to Claude to paste in. The mailing list can be the same one Two-Stroke Morning uses.

## The anonymous form (Tally works well, free)

1. Make a new form, e.g. "Neighborhood Barbecue: which barbecue would you rather be at?"
2. Add these **hidden fields**, spelled exactly like this. The page fills them in:
   - `keep_grass`: `mower`, `mix`, `graze` or `thicket`
   - `role`: `unsure`, `baker`, `gardener`, `herder`, `pitmaster`, `musician`, `spinner_weaver`, `potter`, `beekeeper`, `wheelwright`, `teacher` or `other`
   - `join`: `yes`, `maybe` or `no`
   - `divider_pct_someday`: 0 to 100, where the person left the divider
   - `scene`: `block` or `fest`; `scenes_seen`: which scenes they opened
   - `season`, `dusk` (`yes`/`no`), `sound` (`on`/`never`)
   - `clicked`: the people and things they clicked on, in order (short ids such as `cook`, `shep`, `f_pit`, `f_goats`)
3. Add two **optional** visible questions: "Your region (state, or the first three digits of your ZIP code)" and "Anything you'd like to add? (Please don't include names, addresses or contact details.)"
4. **Don't** add any name or email question, and turn off anything that records who answered.
5. Publish and paste the share link (`https://tally.so/r/XXXXXX`) into `formUrl`.

## Reading the answers

Export to CSV and publish **totals only**, leaving out any group smaller than about 10 people. Good first questions: how many would let animals keep the grass, which someday jobs people pick, and whether people who spent longer on the someday side answer differently.

## Google Forms instead (one script builds everything)

`google-forms-setup.gs` in this folder builds the whole pipeline in your Google account:

1. Go to https://script.google.com, click **New project**, paste in the whole file, and save.
2. Choose `setupNeighborhoodBarbecue` and click **Run**. Allow it to make forms and sheets in your Drive.
3. The **Execution log** prints a `COUNT_CFG = {...}` block. Send it to Claude, or paste it over `COUNT_CFG` in `index.html`.

It makes the anonymous form, an answers spreadsheet with a **Totals** tab (groups under 10 show as "fewer than 10"), and a separate "Lab updates sign-up" form with its own emails spreadsheet. The page fills in the form for the person, and they can see and change every value before sending.

Share only the Totals tab. Keep both spreadsheets private and never merge them.
