# Tofu Japanese Study Studio

An independent Japanese study companion for lessons 0–4, built for Cloudflare Pages. It has listening and reading, kana and kanji writing, lesson vocabulary, dictation, matching, a hiragana typing chase, and a private library for shared files. The interface supports English, Japanese, Chinese, Spanish, French, and German. It has day/night themes, full screen, a 0–100 volume slider, and no saved scores or learner accounts.

This project is unaffiliated with the Tobira publisher. The repository and ZIP do **not** contain the textbook PDF, publisher audio, textbook passages, a password, or anyone's personal notes. The included original readings and fallback starter vocabulary are not a complete transcription of the book. Private lesson content belongs in Cloudflare KV, uploaded through the owner interface.

## The simple publishing path

The site is designed for this flow:

**GitHub repository → Cloudflare Pages → password sign-in → private Cloudflare Workers KV files.**

GitHub contains the website code. Cloudflare Pages runs the password gate. Workers KV stores any lesson files you choose to share in a private namespace. Readers can open files only through the signed-in website. A shared password limits access but cannot prove that someone purchased a book. Give the password only to people you intend to admit, and check your rights before sharing publisher material.

You can set up the production site entirely in the GitHub and Cloudflare dashboards. A paid domain is optional. [Workers KV's Free plan](https://developers.cloudflare.com/kv/platform/pricing/) includes 1 GB of stored data, 100,000 reads, 1,000 writes, and 1,000 list requests per day. When a daily Free-plan limit is reached, further operations of that type fail until the daily reset; reaching the storage limit requires removing files. These Free-plan limits do not create overage charges. Pages Functions have their own usage limits. The project does not need an R2 subscription.

### 1. Put the site on GitHub

If you already have the `friendlytofu/tofu-j1-study-studio` repository, open its local folder in GitHub Desktop, review the changed files, commit them, and click **Push origin**. Confirm GitHub shows the new `functions/_middleware.js` and `public/_routes.json`. You can also update files at the same paths using GitHub's **Add file → Upload files**. Then continue with step 2. Otherwise:

1. Extract `tofu-j1-study-studio.zip`. Upload the **contents** of the extracted folder to a GitHub repository, including `public`, `functions`, `README.md`, `LICENSE`, `package.json`, and `.gitignore`.
2. Confirm that GitHub shows `public/index.html`, `public/_routes.json`, and `functions/_middleware.js` at those exact paths. Do not upload the enclosing folder or just the ZIP.
3. Keep passwords, PDF books, publisher MP3s, and private notes out of GitHub, even if you make the repository private. The site files are meant to be public code.

### 2. Connect GitHub to Cloudflare Pages

1. In the [Cloudflare dashboard](https://dash.cloudflare.com/), open **Workers & Pages → Create application → Pages → Connect to Git**. Connect GitHub and select your repository.
2. Use these build settings:

   | Setting | Value |
   | --- | --- |
   | Framework preset | None / No framework |
   | Production branch | `main` |
   | Root directory | Repository root |
   | Build command | `exit 0` |
   | Build output directory | `public` |

3. Deploy. The first visit should say the site setup is incomplete. That is expected: the gate **fails closed** until the secrets in step 3 are present.

The `functions` folder must be at the repository root, beside `public`. `public/_routes.json` sends every request through the password gate, including JavaScript, styles, and media requests. Do not remove or exclude routes from it.

### 3. Add three Cloudflare secrets

In **Workers & Pages → your Pages project → Settings → Variables and Secrets**, add these names. Choose **Encrypt** for each value. Add them to the production environment. If you use preview deployments with real material, configure those separately too.

| Secret name | What to enter |
| --- | --- |
| `SITE_PASSWORD` | The reader password you want to share. Keep it in Cloudflare, never in GitHub or this README. |
| `ADMIN_PASSWORD` | A different, strong password known only to you. This signs in as the owner and shows the upload form. |
| `SESSION_SECRET` | A unique random string of at least 32 characters, used to sign 8-hour login cookies. Generate and keep it in a password manager. |

The reader and admin passwords **must differ**. Cloudflare will return a setup error if a secret is absent, the two passwords match, or `SESSION_SECRET` is too short. To generate a suitable session secret on a computer with OpenSSL, run `openssl rand -hex 32`, then paste the result only into Cloudflare's encrypted secret field. Never commit it to GitHub.

Save the secrets and **redeploy** the Pages project so its Functions receive the new settings. Try the `*.pages.dev` address in a private browser window: the sign-in screen should appear. A wrong password must leave you outside. Signing in with the owner password should later show the upload form.

### 4. Add private storage for shared files

1. In Cloudflare, open **Workers KV → Create namespace**. Name it something like `tofu-j1-materials`. Choose ordinary **Workers KV**, not the separate KV Instant beta.
2. Return to **Workers & Pages → your Pages project → Settings → Bindings → Add → KV namespace**. Set the **variable name** to exactly `MATERIALS_KV` and select the namespace you created.
3. Save and **redeploy** the Pages project again. The Library tab should now show an empty state instead of a storage setup error.

The namespace name can be anything; `MATERIALS_KV` is the exact binding variable the code expects. Files uploaded through the site go to KV and do not appear in the GitHub repository or ZIP. The code splits each file into 8 MiB pieces to fit KV's per-value limit and preserve audio seeking. KV can take about a minute to make a new upload visible at other locations. This is normal; use **Refresh** if it does not appear immediately.

If you set up the older `MATERIALS` R2 binding, remove that binding after KV works. This version no longer uses R2. No file migration is needed if you have not uploaded anything there.

### 5. Sign in and upload

1. Open your Pages address. Enter your separate **admin** password.
2. Open **Library → Add a shared file**.
3. Choose a title, lesson 0–4, and a file. Supported formats are `.mp3`, `.pdf`, `.txt`, and `.md`, up to 50 MB per file.
4. For an MP3, select its exact numbered track, such as `L04-01`. A file named `L04-01.mp3` fills in this choice for you. Check it before uploading. Audio then plays from **Listen & read**, with seeking and segment replay.
5. For a `.txt` or `.md` transcript that matches a numbered recording, select the same track ID. It will display beside that track. Only choose a track after comparing the entire text with the audio. PDF and unnumbered text files remain available from the Library.
6. Sign out. Sign in with the **reader** password in a separate browser session to check what readers can see. Readers cannot see the upload form or upload through the API.

For many numbered recordings, use **Library → Upload numbered audio together**. Select all matching MP3 files (or one lesson at a time). The site checks names such as `L04-01.mp3`, derives the lesson and exact track, uploads one file at a time, and skips tracks already in the library. Keep the page open until the progress message says it is done. If it stops, select the same files again; completed tracks will be skipped. Text and PDF files still use **Add a shared file**, where you must review any track match yourself.

To use a complete private vocabulary list, upload a UTF-8 text file named exactly `tofu-vocabulary-lessons-0-4.txt` with **No track** selected. Its contents must be JSON with a `vocabulary` object whose keys are lesson numbers `0` through `4`. Each key contains an array of `{ "written": "...", "reading": "...", "meaning": "..." }` entries. Set `"practice": false` on counters, templates, or ambiguous alternatives that should remain visible in Vocabulary but should not appear in Dictation or Matching. Sign in as a reader and confirm the five lesson counts. This file stays in KV and is fetched only after password sign-in; do not add it to `public` or GitHub if it contains textbook material. If you upload a corrected pack later, use the same filename; the newest file takes precedence.

The owner controls are enforced by the Cloudflare Function, not just hidden in the browser. Uploaded files are available to anyone who has the reader password, so only upload material you are allowed to share. Changing the reader password stops future sign-ins with the old password; to end existing 8-hour sessions immediately, also change `SESSION_SECRET` and redeploy.

### 6. Publish later changes

Edit the site files at the same paths in GitHub and commit them. Cloudflare automatically creates a new deployment. You do not upload the ZIP to Cloudflare. Shared files stay in KV when the code is redeployed. To remove a shared file, delete its `materials:meta:<id>` key and all matching `materials:chunk:<id>:<number>` keys from the KV namespace in the Cloudflare dashboard, then click **Refresh** in the Library. The ID is the value of `id=` in that file's Library link.

## Study content and accuracy

- **Listen & read:** Five original Japanese readings use your device's Japanese voice. The site catalogs 96 lesson 0–4 textbook track IDs. A shared MP3 is connected to a track only through the exact ID selected by the owner. The player supports seeking and a start/end loop. Visitors can also select personal MP3s for their own browser session without sharing them.
- **Writing:** 46 basic hiragana, 46 basic katakana, and 31 lesson 3–4 kanji with dotted four-part practice squares. The animated guides load from the credited open projects below. Drawing still works if a guide cannot load.
- **Vocabulary:** A small original starter selection is the fallback. When the owner uploads the private vocabulary file described above, its full lesson lists replace the fallback. English meanings stay in English in every interface language. Dictation and Matching skip items marked `practice: false`.
- **Dictation and matching:** Lesson selection, Japanese or English device speech, written/kana answer choices, and immediate feedback. No answers or scores are saved.
- **Typing chase:** A separate hiragana game with a ninja pursuing a thief. Correctly typed characters raise the ninja's speed; three thief speeds change the difficulty. It accepts Japanese keyboard or IME input, and saves no typing data or result.

The textbook PDF is scanned, so text extraction and audio matching require review. Upload a transcript only after checking its printed track label and its audio; other tracks deliberately show no transcript. The optional `public/content.json` supports *original or distributable reviewed material* but is empty by default; putting protected textbook text or paths to media in that public file would publish them on GitHub. For private shared texts, use the owner upload form instead. The [publisher's Japanese–English vocabulary index](https://tobirabeginning.9640.jp/contents1/index/) can help check lesson assignments and kana spellings.

The official [Tobira audio page](https://tobirabeginning.9640.jp/contents1/audio/) describes access for purchasers. Access does not itself establish permission to redistribute recordings, PDFs, or passages to every holder of a shared password. Review your license or ask the publisher before uploading those files to KV. The software's MIT license covers this site's original code; it does not relicense third-party textbook content.

Stroke guides are fetched when used from [KanjiVG](https://github.com/KanjiVG/kanjivg) for kanji and [strokesvg](https://github.com/zhengkyl/strokesvg) for kana. Those projects have their own licenses. Their SVG files are not included here.

## Local testing (optional)

The password gate needs Cloudflare Pages Functions. Opening `public/index.html` directly or serving only `public` with a basic static server **does not test or enforce access protection**.

If you use [Wrangler](https://developers.cloudflare.com/pages/functions/local-development/), create an untracked `.dev.vars` file in the project root with the same three secret names and local test values. It is ignored by Git. Run `wrangler pages dev public --kv=MATERIALS_KV` from the project root, then open the local address Wrangler prints. Do not use production passwords in `.dev.vars`; this is only a local test. `npm test` runs the included access-control checks without needing Cloudflare credentials.

## File map

```text
README.md                 Setup and content guidance
LICENSE                   MIT terms; Tofu copyright
package.json              No-dependency local test command
functions/_middleware.js  Password gate, signed sessions, owner upload and private KV file access
public/_routes.json       Sends every request through the gate
public/index.html          Site structure and owner upload form
public/styles.css          Day/night and responsive design
public/app.js              Player, practice, library, upload and controls
public/data.js             Original readings, starter words, characters and track IDs
public/i18n.js             Six interface-language dictionaries
public/content.json        Empty optional public content map
public/favicon.svg         Site icon
```

## If something does not work

- **Setup message instead of sign-in:** Check the three encrypted secret names, their values, and that you redeployed after saving them. The admin and reader passwords must be different.
- **Library says storage is unavailable:** Check the KV binding name `MATERIALS_KV`, confirm it points to your namespace, then redeploy.
- **A newly uploaded file is missing:** KV changes may take around a minute to reach another location. Wait briefly and select **Refresh**. Daily request limits reset the next day; if the 1 GB storage limit is full, remove older materials.
- **Audio is not beside a track:** Confirm the uploaded MP3 has the exact `L00-01`–`L04-22` style ID and the right lesson. Unnumbered PDFs and texts remain in Library.
- **Wrong language, theme, or voice:** Language and theme are device preferences. Device-generated speech depends on the browser and installed voices.
- **Site shows 404:** Confirm GitHub has `public/index.html`, the build output is `public`, and `functions/_middleware.js` is beside `public` at the repository root.

Official setup references: [Cloudflare Pages Functions](https://developers.cloudflare.com/pages/functions/get-started/), [routing](https://developers.cloudflare.com/pages/functions/routing/), [bindings and secrets](https://developers.cloudflare.com/pages/functions/bindings/), [KV pricing and Free-plan limits](https://developers.cloudflare.com/kv/platform/pricing/), and [Pages Git integration](https://developers.cloudflare.com/pages/get-started/git-integration/).
