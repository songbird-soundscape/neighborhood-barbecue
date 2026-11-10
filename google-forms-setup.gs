/**
 * Neighborhood Barbecue: build the "Be counted" pipeline in your own Google account.
 *
 * How to run it (once):
 *   1. Go to https://script.google.com and click "New project".
 *   2. Delete what's there, paste this whole file in, and click Save.
 *   3. Pick "setupNeighborhoodBarbecue" in the function menu and click Run.
 *      Google asks you to allow it to make forms and sheets in your Drive: allow it.
 *   4. Open "Execution log" at the bottom. Copy the block that starts with COUNT_CFG
 *      and send it to Claude, or paste it into COUNT_CFG in index.html yourself.
 *
 * What it makes, all in your Drive:
 *   - "Neighborhood Barbecue: which barbecue would you rather be at?"  (anonymous form)
 *   - "Neighborhood Barbecue answers"  (its spreadsheet, with a Totals tab)
 *   - "Lab updates sign-up"  (a separate form for emails)
 *   - "Lab updates emails"  (its own separate spreadsheet)
 * The two spreadsheets are never linked, which is the promise the page makes.
 */

// The three questions. The choice wording must match the page's dropdowns exactly.
const KEEP = ['The mower, same as now', 'Some lawn, some garden', 'Animals: sheep, goats, maybe bison', 'Nobody: let it grow like the Thicket'];
const ROLE = ['Not sure yet', 'Bake', 'Garden', 'Herd the flock or the bison', 'Run the barbacoa pit', 'Play in the band', 'Spin or weave', 'Make pottery', 'Keep bees', 'Fix wheels and bikes', 'Teach the kids', 'Something else'];
const JOIN = ['Yes, tomorrow', 'Maybe, if it worked', 'No, I like my lawn'];
// Filled in by the page: how the person used it. Plain settings only, nothing identifying.
const AUTO = [
  ['divider_pct_someday', 'Divider: percent someday'], ['scene', 'Scene when you clicked'], ['scenes_seen', 'Scenes you saw'], ['season', 'Season'],
  ['dusk', 'Dusk'], ['clicked', 'Who you clicked on'], ['sound', 'Sound'],
];
const SMALL_GROUP = 10;   // totals under this are shown as "fewer than 10", so nobody can be picked out

function setupNeighborhoodBarbecue() {
  // ---------- 1. the anonymous form ----------
  const form = FormApp.create('Neighborhood Barbecue: which barbecue would you rather be at?');
  form.setDescription('Anonymous: no names, emails or exact locations. Only totals are ever published, and groups smaller than 10 are never shown.')
    .setCollectEmail(false).setAllowResponseEdits(false).setShowLinkToRespondAgain(false).setProgressBar(false)
    .setConfirmationMessage('Thank you. You have been counted.');
  const items = {};
  items.keep_grass = form.addMultipleChoiceItem().setTitle('What should keep the grass on your block?').setChoiceValues(KEEP).setRequired(true);
  items.role = form.addMultipleChoiceItem().setTitle('On the someday block, what would you do?').setChoiceValues(ROLE).setRequired(true);
  items.join = form.addMultipleChoiceItem().setTitle('Would you join a block like the someday one?').setChoiceValues(JOIN).setRequired(true);
  form.addTextItem().setTitle('Your region (optional): state, or the first three digits of your ZIP code');
  form.addParagraphTextItem().setTitle("Anything you'd like to add? (optional; please don't include names, addresses or contact details)");
  form.addSectionHeaderItem().setTitle('Filled in by the page').setHelpText('How you used the page. You can change or clear these before sending.');
  AUTO.forEach(([key, title]) => { items[key] = form.addTextItem().setTitle(title); });

  // ---------- 2. its spreadsheet, with a Totals tab ----------
  const ss = SpreadsheetApp.create('Neighborhood Barbecue answers');
  form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());
  SpreadsheetApp.flush(); Utilities.sleep(2000);
  const resp = SpreadsheetApp.openById(ss.getId()).getSheets().find(s => s.getFormUrl()) || ss.getSheets()[0];
  const R = `'${resp.getName()}'`;
  const totals = ss.insertSheet('Totals');
  const rows = [['Totals only. Groups under ' + SMALL_GROUP + ' show as "fewer than ' + SMALL_GROUP + '". Share this tab, never the answers tab.', ''], ['', '']];
  const block = (title, col, choices) => { rows.push([title, 'People']); choices.forEach(c => rows.push([c,
    `=IF(COUNTIF(${R}!${col}2:${col},A${rows.length + 1})<${SMALL_GROUP},"fewer than ${SMALL_GROUP}",COUNTIF(${R}!${col}2:${col},A${rows.length + 1}))`])); rows.push(['', '']); };
  // column A is the timestamp, so the questions start at B
  block('What should keep the grass?', 'B', KEEP);
  block('What would you do on the someday block?', 'C', ROLE);
  block('Would you join?', 'D', JOIN);
  rows.push(['Everyone who answered', `=COUNTA(${R}!A2:A)`]);
  totals.getRange(1, 1, rows.length, 2).setValues(rows);
  totals.getRange('A1').setFontWeight('bold'); totals.setColumnWidth(1, 380);
  const def = ss.getSheetByName('Sheet1'); if (def && ss.getSheets().length > 2) ss.deleteSheet(def);

  // ---------- 3. find the link fields the page fills in ----------
  const r = form.createResponse();
  r.withItemResponse(items.keep_grass.asMultipleChoiceItem().createResponse(KEEP[0]));
  r.withItemResponse(items.role.asMultipleChoiceItem().createResponse(ROLE[0]));
  r.withItemResponse(items.join.asMultipleChoiceItem().createResponse(JOIN[0]));
  AUTO.forEach(([key]) => r.withItemResponse(items[key].asTextItem().createResponse('X')));
  const pre = r.toPrefilledUrl();
  const ids = [...pre.matchAll(/entry\.(\d+)=/g)].map(m => 'entry.' + m[1]);
  const keys = ['keep_grass', 'role', 'join', ...AUTO.map(a => a[0])];
  const fields = {}; keys.forEach((k, i) => { fields[k] = ids[i]; });

  // ---------- 4. the separate updates sign-up ----------
  const news = FormApp.create('Lab updates sign-up');
  news.setDescription('News when the lab\'s pages improve and when a new one comes out. Your email is used only for these updates and is never linked to any survey answers. Unsubscribe any time by replying "unsubscribe".')
    .setCollectEmail(false).setConfirmationMessage("You're on the list. Thanks!");
  news.addTextItem().setTitle('Your email').setRequired(true).setValidation(FormApp.createTextValidation().requireTextIsEmail().build());
  const ns = SpreadsheetApp.create('Lab updates emails');
  news.setDestination(FormApp.DestinationType.SPREADSHEET, ns.getId());

  const cfg = { formUrl: form.getPublishedUrl(), fields, newsUrl: news.getPublishedUrl() };
  Logger.log('COUNT_CFG = ' + JSON.stringify(cfg, null, 2));
  Logger.log('Answers spreadsheet (keep private; share only the Totals tab): ' + ss.getUrl());
  Logger.log('Emails spreadsheet (keep private, never merge with answers): ' + ns.getUrl());
  Logger.log('Edit the forms here: ' + form.getEditUrl() + '  and  ' + news.getEditUrl());
}
