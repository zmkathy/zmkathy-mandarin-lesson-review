# Mandarin Lesson Review

A mobile-first website for adult beginner Mandarin students to review ten lessons and practise Pinyin pronunciation.

It uses:

- React
- Vite
- JavaScript
- Teacher-approved MP3 pronunciation recordings

There is no login, account, database, quiz, flashcard system, progress tracking, or admin dashboard.

## Run Locally

Open Terminal, go into this project folder, then run:

```bash
cd "/Users/zmkathy/Documents/Tool learning/mandarin-lesson-review"
npm install
npm run dev
```

After it starts, open the local website address shown in Terminal. It usually looks like:

```text
http://localhost:5173/
```

## Edit Lesson Content Without Touching Code

For normal editing, only change this file:

```text
public/lessons.txt
```

You can open it with a normal text editor. You do not need to edit React code.

Each lesson uses this simple format:

```text
# Lesson 3: Ordering Coffee

## Key Vocabulary
咖啡 | kāfēi | Coffee

## Key Sentences
我要一杯咖啡。 | wǒ yào yì bēi kāfēi. | I would like a cup of coffee.
```

Important:

- Keep the lesson title line starting with `# Lesson`.
- Keep the section titles as `## Key Vocabulary` and `## Key Sentences`.
- Each vocabulary or sentence line uses this order:

```text
Chinese | Pinyin | English
```

- The vertical line `|` separates the three parts.
- Lines starting with `//` are notes and will not show on the website.

## Add Vocabulary

Inside `public/lessons.txt`, add a new line under `## Key Vocabulary`.

Example:

```text
谢谢 | xièxie | Thank you
```

## Add Sentences

Inside `public/lessons.txt`, add a new line under `## Key Sentences`.

Example:

```text
你叫什么名字？ | nǐ jiào shénme míngzi? | What is your name?
```

There is also a backup data file at `src/data/lessons.js`, but you normally do not need to edit it.

## Pinyin Pronunciation

The Pinyin Chart does not use browser-generated speech. It plays approved MP3 files from:

```text
public/audio/pinyin/
```

The integrated Female Voice 1 files retain the original Tone Perfect names, such as `ma1_FV1_MP3.mp3`. The filenames use `v` for `ü`, such as `nv3_FV1_MP3.mp3`.

The recordings are from *Tone Perfect: Multimodal Database for Mandarin Chinese* by Catherine Ryu, the Mandarin Tone Perception & Production Team, and Michigan State University Libraries. They are used without audio modification under [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/).

When a recording is not available, the chart stays silent and displays a preparation message.

## Deploy to GitHub Pages Later

This project includes a GitHub Actions workflow at:

```text
.github/workflows/deploy.yml
```

After the project is uploaded to GitHub, GitHub can automatically build and publish the site with GitHub Pages.

Recommended beginner steps:

1. Create a GitHub repository.
2. Upload or push this project to the repository.
3. In GitHub, open the repository settings.
4. Go to `Pages`.
5. Under `Build and deployment`, choose `GitHub Actions`.
6. Push changes to the `main` branch.
7. GitHub will build the site and give you a public URL.

The final student link will usually look like:

```text
https://your-github-username.github.io/your-repo-name/
```

## Project Structure

```text
src/
  components/
    LessonCard.jsx
    LessonPage.jsx
    PinyinChart.jsx
    SentenceCard.jsx
    SiteHeader.jsx
    SpeakButton.jsx
    VocabularyCard.jsx
  data/
    lessons.js
    parseLessonsText.js
    pinyinChart.js
  App.jsx
  main.jsx
  styles.css
public/
  lessons.txt
  audio/pinyin/
```
