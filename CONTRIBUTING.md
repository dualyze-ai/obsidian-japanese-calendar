# Contributing to Japanese Calendar

Thank you for your interest in contributing!

## Reporting Issues

Please use [GitHub Issues](https://github.com/kojiman55/obsidian-japanese-calendar/issues) to report bugs or request features.

Include the following when reporting a bug:
- Obsidian version
- Plugin version
- Steps to reproduce

## Development Setup

```bash
git clone https://github.com/kojiman55/obsidian-japanese-calendar.git
cd obsidian-japanese-calendar
npm install
npm run build
```

Copy `main.js`, `manifest.json`, and `styles.css` to your vault's `.obsidian/plugins/japanese-calendar/` folder.

## Pull Requests

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes
4. Push to your branch and open a pull request

## Code Style

- TypeScript
- Run `npm run lint` before submitting
