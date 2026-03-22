q<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/e350ac6f-e985-4d62-8889-3334326a5068

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
<p align="center">
  <img src="https://raw.githubusercontent.com/sumanth2008/Project-Null/main/assets/logo.png" alt="NullMatrix Logo" width="200">
</p>

<p align="center">
  <img src="https://img.shields.io/github/license/sumanth2008/Project-Null?style=for-the-badge&color=blue" alt="License">
  <img src="https://img.shields.io/github/v/release/sumanth2008/Project-Null?style=for-the-badge&color=green" alt="Version">
  <img src="https://img.shields.io/github/actions/workflow/status/sumanth2008/Project-Null/main.yml?style=for-the-badge" alt="Build Status">
  <img src="https://img.shields.io/badge/Discord-Join%20Us-7289DA?style=for-the-badge&logo=discord" alt="Discord">
</p>

---

**NullMatrix: The Next-Generation Autonomous AI Agent for High-Performance Intelligence.**

NullMatrix is a cutting-edge, "Zero Trace" AI framework designed to bridge the gap between local LLM execution and complex task orchestration. Built for developers and security researchers, it provides a robust system for managing on-device AI models with deep system-level integration and high-fidelity output.

## 📍 Table of Contents
* [🧠 Architecture](#-architecture)
* [✨ Key Features](#-key-features)
* [📋 Prerequisites](#-prerequisites)
* [🚀 Quick Start](#-quick-start)
* [⚙️ Configuration](#-configuration)
* [🔍 Deep Dive](#-deep-dive-how-it-works)
* [🛡️ Security Disclaimer](#-security-disclaimer)
* [📜 License](#-license)

---

## 🧠 Architecture
![Architecture](https://raw.githubusercontent.com/sumanth2008/Project-Null/main/assets/architecture-diagram.png)

NullMatrix utilizes a **Multi-Agent Orchestration** layer that separates intent from execution, ensuring that tasks are handled by specialized sub-processes for maximum efficiency and security.

---

## ✨ Key Features
* **Zero-Trace Architecture:** Optimized for privacy-focused environments where local data persistence is strictly controlled and audited.
* **Multi-Model Orchestration:** Seamlessly switch between Google Gemini 1.5 Pro, Flash, and local models like Qwen 3.5 via Ollama.
* **System-Level Integration:** Advanced permission handling for interacting with local environments, file systems, and network stacks.
* **Real-time Observability:** Built-in tracing for monitoring agent reasoning, token usage, and execution logs via Langfuse.
* **Automated Tool Use:** Capable of generating and executing custom scripts in isolated sandboxes to solve complex security and dev tasks.

---

## 📋 Prerequisites
Before deploying NullMatrix, ensure your environment meets the following requirements:
* **OS:** Ubuntu 22.04+, macOS (M1/M2/M3), or Windows with WSL2.
* **Hardware:** 16GB RAM minimum (32GB+ recommended for local LLM inference).
* **Software:** * `Docker` & `Docker Compose`
    * `Python 3.10+`
    * `Node.js v18+`
* **API Access:** A valid Google AI Studio (Gemini) API Key.

---

## 🚀 Quick Start

### 1. Automated Installation (Recommended)
The fastest way to get NullMatrix running is via our interactive installer:
```bash
curl -sSL [https://raw.githubusercontent.com/sumanth2008/Project-Null/main/install.sh](https://raw.githubusercontent.com/sumanth2008/Project-Null/main/install.sh) | bash
# Clone the repository
git clone [https://github.com/sumanth2008/Project-Null.git](https://github.com/sumanth2008/Project-Null.git)
cd Project-Null

# Initialize environment 
cp .env.example .env

# Launch services
docker-compose up -d
