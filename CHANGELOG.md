# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2026-03-26

### Added
- Initial release of the Yandex SpeechKit speech synthesis provider for OpenClaw
- Yandex SpeechKit REST API v3 client with API key and IAM token support
- Speech provider registration for OpenClaw with `yandex` as the provider ID
- Voice catalog metadata and audio format selection for voice notes and file outputs
- Vitest coverage for provider configuration, request shaping, auth headers, and multi-chunk responses
