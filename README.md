# Mandarin Lesson Review

A simple mobile-first website for adult beginner Mandarin students to review key vocabulary and key sentences.

It uses:

- React
- Vite
- JavaScript
- Browser Web Speech API for Mandarin pronunciation

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

## Pronunciation

The speaker button uses the browser Web Speech API.

It is set to Mandarin Chinese:

```javascript
zh-CN
```

Students can click the speaker button repeatedly and follow along.

Pronunciation quality depends on the browser and the Mandarin voices installed on the computer or phone. The app will try to choose a Mandarin `zh-CN` voice first. If the voice sounds strange, try opening the site in Chrome or Safari, or install a higher-quality Mandarin Chinese system voice on the device.

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
    SentenceCard.jsx
    SpeakButton.jsx
    VocabularyCard.jsx
  data/
    lessons.js
    parseLessonsText.js
  utils/
    speech.js
  App.jsx
  main.jsx
  styles.css
public/
  lessons.txt
```
