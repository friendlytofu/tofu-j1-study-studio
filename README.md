# Japanese Study Studio

A static, independent study site for Japanese lessons 0–4. It has a compact control dock, day and night palettes, six interface languages, a full-screen view, listening and reading, kana and kanji writing practice, a vocabulary browser, audio dictation, and word matching. It does not have accounts, analytics, a database, or saved scores.

This is an independent companion, not a Tobira product or an official reproduction of the book. The public package contains original practice readings and a curated starter selection of words. It does **not** contain the Tobira PDF, publisher audio, password, textbook passages, or complete textbook vocabulary lists. Anyone publishing additional material must make their own rights decision and verify every audio–text pairing.

## Publish the website: GitHub → Cloudflare Pages

You can do this in your browser. You do not need a terminal, coding tools, or a paid domain. GitHub holds the site files; Cloudflare Pages turns them into a public website.

### 1. Unzip and check the files

1. Unzip `japanese-study-studio.zip` on your computer.
2. Open the extracted folder. You should see `README.md`, `LICENSE`, `.gitignore`, and a folder named `public`. Inside `public`, you should see `index.html`.
3. Keep the Tobira PDF and MP3 files out of this folder. The public site lets you select your purchased MP3s privately after visiting it.

**Upload the extracted files, not the ZIP itself.** The `public` folder must be at the top level of the GitHub repository. On a Mac, press **Shift + Command + .** in Finder if `.gitignore` is hidden.

### 2. Put the files on GitHub

1. Sign in to [GitHub](https://github.com/) and open [New repository](https://github.com/new).
2. Name it `japanese-study-studio` (or another name you like). Choose **Public** or **Private**. Leave GitHub's **Add a README**, **Add .gitignore**, and **Choose a license** options unchecked; those files are already included. Click **Create repository**.
3. In the empty repository, click **uploading an existing file**. If that link is not shown, use **Add file → Upload files**.
4. Drag the **contents** of the extracted folder into GitHub: `README.md`, `LICENSE`, `.gitignore`, and the whole `public` folder. Do not drag the enclosing `japanese-study-studio` folder.
5. In the file list, confirm that GitHub shows `public/index.html`. It should **not** show `japanese-study-studio/public/index.html`. Add a short commit message such as `Add Japanese study site`, then click **Commit changes**.

GitHub's [file-upload guide](https://docs.github.com/en/repositories/working-with-files/managing-files/adding-a-file-to-a-repository) shows the same upload screen. If you choose a private repository, the deployed Cloudflare website will still be public.

### 3. Connect the repository to Cloudflare

1. Sign in to the [Cloudflare dashboard](https://dash.cloudflare.com/) and select your account.
2. Open **Workers & Pages → Create application → Pages**. Choose **Connect to Git** or **Import an existing Git repository** (the wording can vary).
3. Choose **GitHub**. If Cloudflare asks, authorize its GitHub app and give it access to the repository you just made.
4. Select your repository and click **Begin setup**. Choose a project name; Cloudflare will use it for a `*.pages.dev` address.
5. In **Set up builds and deployments**, enter these values:

   | Setting | Value |
   | --- | --- |
   | Framework preset | **None** / **No framework** |
   | Production branch | `main` (or the branch GitHub shows as your default) |
   | Root directory | Leave blank / use the repository root |
   | Build command | `exit 0` |
   | Build output directory | `public` |
   | Environment variables | None |

6. Click **Save and Deploy** or **Deploy site**. When the deployment says **Success**, open the `*.pages.dev` link Cloudflare gives you. Your website is now published.

Cloudflare's [static HTML guide](https://developers.cloudflare.com/pages/framework-guides/deploy-anything/) confirms the `exit 0` command, and its [Git integration guide](https://developers.cloudflare.com/pages/get-started/git-integration/) explains the repository connection.

### 4. Publish later changes

Edit or upload the changed files at the **same paths** in your GitHub repository and click **Commit changes**. Cloudflare Pages will automatically create a new deployment. You do not need to upload the ZIP to Cloudflare.

If you see **404**, check that GitHub contains `public/index.html` and that Cloudflare's **Build output directory** is exactly `public`. If the repository is missing from Cloudflare's list, check the GitHub app's repository access. The numbered textbook tracks will show “audio not loaded” until a visitor adds their own MP3s; that is expected.

## What is included

| Section | Included behavior |
| --- | --- |
| Listen & read | Five original Japanese readings with device-generated Japanese speech; a numbered catalog for 96 supplied lesson 0–4 track IDs; local MP3 import; a seek bar; start/end points; segment loop; optional verified transcript import. |
| Writing | 46 basic hiragana, 46 basic katakana, and 31 kanji checked against the lesson 3–4 kanji slides. A dotted four-part practice square supports pointer or touch drawing. Stroke guides load from the credited open projects below. |
| Vocabulary | Lesson-by-lesson starter selections with English meanings. The meanings stay in English when the interface language changes. A complete, verified word list can replace each starter list through `content.json`. |
| Dictation | Japanese or English device speech, lesson selection, four answer choices, and written/hiragana/katakana answer modes. The Japanese voice reads the stored kana reading, so the spoken prompt and answer data share the same item. |
| Matching | Five Japanese–English pairs per board, using selected lessons, with immediate feedback and no score history. |

The site supports English, Japanese, Chinese, Spanish, French, and German for its interface. Japanese study text remains Japanese. The vocabulary meanings remain English. The brief translations under the original readings follow the selected interface language; they are hidden in Japanese mode.

The top audio slider controls both imported recordings and device speech from 0 to 100. The theme and interface language are saved only as device preferences. Practice answers and scores are not saved.

## Run it locally

1. Extract this archive.
2. Open a terminal in the extracted folder.
3. Run `python3 -m http.server 8000 --directory public`.
4. Visit `http://localhost:8000` in a current browser.

Opening `index.html` directly as a `file://` page is not recommended because JavaScript modules and `content.json` need an HTTP origin.

No package installation, API key, build, or account is needed for local use. Device speech availability and voice quality depend on the visitor's browser and operating system.

## Use your MP3 files privately

In **Listen & read**, select **Add MP3 files** and choose one or many files. Repeat for another folder. The browser accepts exact names such as `L00-01.mp3`, `L01-06.mp3`, and `L04-22.mp3`. It maps `L00-01.mp3` to the textbook's `L0-1` label. Only the file's number controls the mapping; the site does not infer its transcript from audio or from another track. The files remain in the current browser tab and need to be selected again after a reload.

The supplied lesson 0–3 collection contained 14, 18, 28, and 14 numbered MP3 files; the lesson 4 collection contained 22. These IDs are cataloged, and the categories were checked against the [publisher's audio pages](https://tobirabeginning.9640.jp/contents1/audio/): greetings/kana, conversation, vocabulary recording, speaking activity, listening exercise, and language note. Some official listening exercises have smaller subtracks (for example, `L1-17-1`), while the supplied local set uses the top-level number. The site never claims a smaller subtrack is the whole recording.

## Add reviewed content

`public/content.json` is deliberately empty. It accepts three optional maps:

```json
{
  "transcripts": {
    "L01-01": {
      "text": "…replace with text checked against L01-01.mp3…",
      "bookPage": 32
    }
  },
  "vocabulary": {
    "1": [
      {
        "written": "日本語",
        "reading": "にほんご",
        "meaning": "Japanese language"
      }
    ]
  },
  "audio": {
    "L01-01": "media/L01-01.mp3"
  }
}
```

- `transcripts` are shown only for known lesson 0–4 IDs with nonempty Japanese text. Check both the track number and the full spoken text before adding an entry.
- `vocabulary` replaces the starter list for the named lesson. Use lesson keys `"0"` through `"4"`. Every entry needs `written`, kana `reading`, and English `meaning`. Keep readings exact; dictation speaks the `reading` field.
- `audio` is for files you are entitled to serve publicly. Paths must be relative `media/*.mp3` paths. Put those files in `public/media/` only if distribution is permitted, then explicitly adjust `.gitignore` for that deliberate publication. Never include a publisher password or private token in a public file.

The **Add content JSON** button can also load a checked JSON file for one browser session. This is useful for private textbook notes without publishing them. A checked transcript and its MP3 can therefore be used locally while the GitHub repository and public Cloudflare site remain free of protected media.

## Content and rights

The Tobira textbook and publisher recordings are copyrighted. The [official Tobira audio page](https://tobirabeginning.9640.jp/contents1/audio/) describes its materials as available to purchasers. Having access to them does not itself grant permission to publish the files, transcriptions, or full vocabulary tables to a public repository or site. Keep those files out of a public deployment unless you have the needed rights. The local file picker is the intended study path for purchased audio.

The original readings in `public/data.js` were written for this project. The default vocabulary is a short, manually reviewed starter selection rather than a complete extraction. The textbook PDF available during development was scanned images, so bulk text extraction could not be verified. Missing textbook transcript text is shown plainly instead of being guessed or attached to the wrong recording.

Stroke drawings are fetched at viewing time from [KanjiVG](https://github.com/KanjiVG/kanjivg) for kanji and [strokesvg](https://github.com/zhengkyl/strokesvg) for kana. KanjiVG states its graphics are under [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/); strokesvg states its glyph work is based on [Klee One](https://github.com/fontworks-fonts/Klee) under the SIL Open Font License. The graphics are not bundled in this archive. Internet access is required for the animated stroke guides; the tracing square remains usable without it. Review those projects' licenses if you choose to bundle or alter their assets.

The site code itself is MIT licensed; see `LICENSE`.

## File map

```text
README.md             Setup, content format, rights and limitations
LICENSE               License for this site's original code
.gitignore             Prevents accidental inclusion of private material
public/index.html      Site structure
public/styles.css      Day/night design and responsive layout
public/app.js          Playback, practice, import and UI behavior
public/data.js         Original readings, starter words, characters and track IDs
public/i18n.js         Six interface-language dictionaries
public/content.json    Optional reviewed-content map (empty by default)
public/favicon.svg     Site icon
```

## Quick quality check before each public update

Open the deployed site on a narrow phone and a desktop. Check each navigation tab, all six languages, day/night, full screen, the 0–100 volume control, a local MP3 on lesson 4, seeking and segment replay, kana/kanji stroke loading, a drawing gesture, dictation in both audio modes, and matching. Check every `content.json` transcript against its exact MP3 before publishing it. Confirm that no password, PDF, private note, or unlicensed media has been added to `public/`.
