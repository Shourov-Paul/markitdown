---
name: markitdown
description: Use this skill whenever the user wants to convert documents, files, or folders of various formats (like PDF, Word docx, Excel xlsx, PowerPoint pptx, images, audio, HTML, EPub, ZIP, CSV, JSON, XML, or YouTube URLs) to Markdown. Trigger this skill when MarkItDown is explicitly mentioned, or when a conversion task is requested to extract text or format content as Markdown for LLM use or text analysis.
license: MIT
---

# MarkItDown Guide

MarkItDown is a lightweight Python utility and library for converting various files (PDF, Word, Excel, PowerPoint, Images, Audio, HTML, ZIP, EPub, YouTube transcripts, etc.) into clean Markdown. It is optimized for text analysis pipelines and LLM-based applications.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Command-Line Interface (CLI)](#command-line-interface-cli)
- [Python API Usage](#python-api-usage)
- [Advanced Options & Integrations](#advanced-options--integrations)
- [Security Considerations](#security-considerations)

---

## Prerequisites

Python 3.10 or higher. Install the package using:
```bash
pip install "markitdown[all]"
```
The `[all]` extra installs all optional dependencies (PDF, DOCX, XLSX, audio transcription, YouTube transcription, etc.).

---

## Command-Line Interface (CLI)

You can convert any supported file to Markdown directly from the shell.

### Basic Usage
Convert a file and print the result to stdout:
```bash
markitdown document.pdf
```

### Save Output to a File
Use redirection or the `-o`/`--output` option:
```bash
# Redirection
markitdown document.pdf > document.md

# Output option
markitdown document.pdf -o document.md
```

### Pipe Content
```bash
cat document.pdf | markitdown
```

### Use Plugins
```bash
# List installed plugins
markitdown --list-plugins

# Run with plugins enabled (e.g., OCR plugin)
markitdown --use-plugins document.pdf
```

### Azure Integrations via CLI
```bash
# Document Intelligence
markitdown document.pdf -d -e "<document_intelligence_endpoint>"

# Content Understanding
markitdown document.pdf --use-cu --cu-endpoint "<content_understanding_endpoint>"
```

---

## Python API Usage

### Basic Conversion
```python
from markitdown import MarkItDown

md = MarkItDown()
result = md.convert("test.xlsx")
print(result.text_content)
```

### Narrowest API Principle (Local vs. Stream vs. Response)
To maintain security and precise control over I/O, choose the narrowest API endpoint that fits your use case:

```python
from markitdown import MarkItDown

md = MarkItDown()

# 1. Local files only
result = md.convert_local("path/to/local/file.pdf")

# 2. Streams (most secure, avoids file system paths entirely)
with open("document.pdf", "rb") as f:
    result = md.convert_stream(f, file_extension=".pdf")

# 3. HTTP Response objects
import requests
response = requests.get("https://example.com/document.docx")
result = md.convert_response(response)
```

### Multi-modal/Image Description with LLMs
To generate descriptions for images (or images embedded inside PowerPoint presentations), pass an OpenAI-compatible client and model name:

```python
from markitdown import MarkItDown
from openai import OpenAI

client = OpenAI()
md = MarkItDown(
    llm_client=client,
    llm_model="gpt-4o",
    llm_prompt="Describe this image in detail for a blind user." # Optional
)

result = md.convert("chart.png")
print(result.text_content)
```

---

## Advanced Options & Integrations

### Plugins (e.g., OCR)
Plugins are disabled by default. Enable them to activate OCR or custom file handlers:
```python
from markitdown import MarkItDown
from openai import OpenAI

# The markitdown-ocr plugin extracts text from scanned documents/images using LLM vision
md = MarkItDown(
    enable_plugins=True,
    llm_client=OpenAI(),
    llm_model="gpt-4o"
)
result = md.convert("scanned_invoice.pdf")
print(result.text_content)
```

### Azure Content Understanding (CU)
Best for cloud-based layout extraction, audio/video transcription, custom analyzer fields, or domain-specific extraction.
```python
from markitdown import MarkItDown
from markitdown.converters import ContentUnderstandingFileType

md = MarkItDown(
    cu_endpoint="<content_understanding_endpoint>",
    cu_analyzer_id="my-custom-analyzer", # Optional domain analyzer
    cu_file_types=[ContentUnderstandingFileType.PDF] # Optional: only route PDFs to CU
)
result = md.convert("invoice.pdf")
print(result.markdown)
```

### Azure Document Intelligence
Best for high-fidelity OCR and table layout extraction of document formats.
```python
from markitdown import MarkItDown

md = MarkItDown(docintel_endpoint="<document_intelligence_endpoint>")
result = md.convert("complex_layout.pdf")
print(result.text_content)
```

---

## Security Considerations

> [!WARNING]
> MarkItDown performs I/O operations with the privileges of the active process.

1. **Sanitize Inputs:** Never pass untrusted, user-controlled paths or URLs directly to `convert()`.
2. **Restrict Access:** Restrict allowed URL schemes (e.g., block loopback or metadata endpoints like `169.254.169.254`).
3. **Use Narrow API Endpoints:** Prefer `convert_local()`, `convert_stream()`, or `convert_response()` over the general `convert()` method to limit the file and network operations MarkItDown is allowed to perform.
