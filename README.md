# Discord Text Editor

A lightweight, browser-based tool for formatting Discord messages with Markdown, previewing them live, and copying the final text.

## Features

- Bold, italic, underline, strikethrough, and spoiler formatting
- Headings, quotes, lists, links, inline code, and code blocks
- Quick shortcuts for colored Discord code blocks
- A live preview that processes your text locally in the browser
- A static, zero-build setup with no dependencies

> Discord does not support directly colored regular text. The color shortcuts use syntax-highlighted code blocks, which is Discord's supported workaround.

## Run locally

Open `index.html` in a browser to get started. For the most reliable clipboard support across browsers, serve the project from a local web server.

## Deploy with GitHub Pages

1. Push the repository to GitHub.
2. Open **Settings → Pages** in the repository.
3. Choose **Deploy from a branch**, then select the `main` branch and the `/ (root)` folder.
4. Save the setting. GitHub will create the site URL within a few minutes.

## Contributing

Bug reports, ideas, and pull requests are welcome. For larger changes, please open an issue first so we can discuss the approach.

## License

This project is licensed under the [MIT License](LICENSE).
