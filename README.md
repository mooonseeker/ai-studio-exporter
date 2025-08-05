# AI Studio Exporter

[中文版](README_CN.md)

A Chrome extension that exports Gemini chat history from Google AI Studio to Markdown format.

## Features

- Adds an "Export" button to code dialogs in Google AI Studio
- Parses conversation content into structured Markdown format
- Automatically downloads the generated Markdown file
- Distinguishes between user and model dialogue content
- Automatically splits model responses into "think" and "answer" sections

## Installation

1. Clone this repository or download the ZIP file
2. Open Chrome browser and go to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the root directory of this project

## Usage

1. Open Google AI Studio (<https://aistudio.google.com/>)
2. In any code dialog, click the "Export" button
3. The system will automatically download a Markdown file named `gemini-chat-history.md`

## Technical Implementation

- Uses MutationObserver to monitor DOM changes and dynamically inject the export button
- Parses conversation content in code dialogs using regular expressions
- Formats the parsed results into Markdown structure:
  - Level 1 heading for the overall conversation
  - Level 2 headings to distinguish between user and model
  - Level 3 headings to split model responses into "think" and "answer" sections

## License

MIT License
