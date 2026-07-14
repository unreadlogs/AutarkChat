---
title: Changelog
description: Release history of AutarkChat
sidebar_position: 999
---

# Changelog

## 1.2.0 — Artifact Files Support

- Introduced artifact side panel for viewing generated files (code, PDFs, images, text)
- Added `artifact`, `skill_view`, and `execute_command` tools to the AI function calling system
- Added collapsible console blocks in message bubbles for tool execution output
- Implemented `ArtifactPanel` with PDF, image, and text file rendering

## 1.1.0 — Skills Registry & Terminal Execution

- Added filesystem-based skills registry (`skills/` directory)
- Skills API: install, list, enable/disable, and uninstall skills via UI or API
- Terminal execution tool (`execute_command`) for running Python/shell scripts on the server
- Chronological response parts with streaming text interleaved with tool calls
- Token usage analytics with daily charts and cost estimates
- Settings console: theme, hotkey, density preferences
- Model comparison workflow (`/compare` page)
- Provider presets for 23 OpenAI-compatible endpoints
- Personalization system (name, occupation, custom instructions)

## 1.0.0 — Stable Base Model

- Initial release
- Single-admin password authentication with bearer token sessions
- Chat with OpenAI-compatible models via SSE streaming
- Multi-model compare mode (send one prompt to multiple models)
- Custom model registry (CRUD via API and UI)
- Chat history with pin/delete, grouped by date
- MongoDB persistence (chats, messages, artifacts, models, sessions, usage)
- Monochrome design system with light/dark theme
- Streamdown-powered streaming markdown rendering
