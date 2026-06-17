#!/usr/bin/env python3
"""Generate the PDF version of the installation guide."""

from __future__ import annotations

import html
import re
import sys
import os
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import Paragraph, Preformatted, SimpleDocTemplate, Spacer

ROOT_DIR = Path(__file__).resolve().parents[2]
SOURCE_PATH = Path(os.environ.get("INSTALL_GUIDE_SOURCE", ROOT_DIR / "docs" / "installation-guide.md"))
OUTPUT_PATH = Path(os.environ.get("INSTALL_GUIDE_OUTPUT", ROOT_DIR / "docs" / "installation-guide.pdf"))


def inline_markup(text: str) -> str:
    escaped = html.escape(text)
    escaped = re.sub(r"`([^`]+)`", lambda match: f'<font face="Courier">{match.group(1)}</font>', escaped)
    escaped = re.sub(r"\*\*([^*]+)\*\*", lambda match: f"<b>{match.group(1)}</b>", escaped)
    return escaped


def flush_paragraph(lines: list[str], story: list, body_style: ParagraphStyle) -> None:
    if not lines:
        return
    text = " ".join(part.strip() for part in lines if part.strip())
    if text:
        story.append(Paragraph(inline_markup(text), body_style))
        story.append(Spacer(1, 0.2 * cm))
    lines.clear()


def build_story(markdown: str, styles: dict[str, ParagraphStyle]) -> list:
    story: list = []
    paragraph_lines: list[str] = []
    code_lines: list[str] = []
    in_code_block = False

    for raw_line in markdown.splitlines():
        line = raw_line.rstrip()
        stripped = line.strip()

        if line.startswith("```"):
            if in_code_block:
                story.append(Preformatted("\n".join(code_lines), styles["code_block"]))
                story.append(Spacer(1, 0.25 * cm))
                code_lines.clear()
                in_code_block = False
            else:
                flush_paragraph(paragraph_lines, story, styles["body"])
                in_code_block = True
            continue

        if in_code_block:
            code_lines.append(line)
            continue

        if not stripped:
            flush_paragraph(paragraph_lines, story, styles["body"])
            continue

        if line.startswith("# "):
            flush_paragraph(paragraph_lines, story, styles["body"])
            story.append(Paragraph(inline_markup(line[2:].strip()), styles["title"]))
            story.append(Spacer(1, 0.35 * cm))
            continue

        if line.startswith("## "):
            flush_paragraph(paragraph_lines, story, styles["body"])
            story.append(Paragraph(inline_markup(line[3:].strip()), styles["h2"]))
            story.append(Spacer(1, 0.22 * cm))
            continue

        if line.startswith("### "):
            flush_paragraph(paragraph_lines, story, styles["body"])
            story.append(Paragraph(inline_markup(line[4:].strip()), styles["h3"]))
            story.append(Spacer(1, 0.18 * cm))
            continue

        if line.startswith("- "):
            flush_paragraph(paragraph_lines, story, styles["body"])
            story.append(Paragraph(inline_markup(line[2:].strip()), styles["bullet"]))
            continue

        numbered = re.match(r"^(\d+)\.\s+(.*)$", line)
        if numbered:
            flush_paragraph(paragraph_lines, story, styles["body"])
            story.append(Paragraph(inline_markup(f"{numbered.group(1)}. {numbered.group(2)}"), styles["body"]))
            story.append(Spacer(1, 0.1 * cm))
            continue

        paragraph_lines.append(line)

    flush_paragraph(paragraph_lines, story, styles["body"])
    if code_lines:
        story.append(Preformatted("\n".join(code_lines), styles["code_block"]))

    return story


def page_decorator(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(colors.HexColor("#D0D7DE"))
    canvas.setLineWidth(0.5)
    canvas.line(doc.leftMargin, A4[1] - 1.1 * cm, A4[0] - doc.rightMargin, A4[1] - 1.1 * cm)
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(colors.HexColor("#6B7280"))
    canvas.drawString(doc.leftMargin, 0.9 * cm, "USV Events Installation Guide")
    canvas.drawRightString(A4[0] - doc.rightMargin, 0.9 * cm, f"Page {canvas.getPageNumber()}")
    canvas.restoreState()


def generate_pdf() -> Path:
    if not SOURCE_PATH.exists():
        raise FileNotFoundError(f"Markdown source not found: {SOURCE_PATH}")

    markdown = SOURCE_PATH.read_text(encoding="utf-8")
    styles = getSampleStyleSheet()
    styles["Title"].fontName = "Helvetica-Bold"
    styles["Heading2"].fontName = "Helvetica-Bold"
    styles["Heading3"].fontName = "Helvetica-Bold"

    custom_styles = {
        "title": ParagraphStyle(
            "GuideTitle",
            parent=styles["Title"],
            fontName="Helvetica-Bold",
            fontSize=22,
            leading=26,
            textColor=colors.HexColor("#0F172A"),
            alignment=TA_CENTER,
            spaceAfter=8,
        ),
        "h2": ParagraphStyle(
            "GuideHeading2",
            parent=styles["Heading2"],
            fontName="Helvetica-Bold",
            fontSize=14,
            leading=18,
            textColor=colors.HexColor("#1F2937"),
            spaceBefore=6,
            spaceAfter=2,
        ),
        "h3": ParagraphStyle(
            "GuideHeading3",
            parent=styles["Heading3"],
            fontName="Helvetica-Bold",
            fontSize=11,
            leading=14,
            textColor=colors.HexColor("#374151"),
            spaceBefore=4,
            spaceAfter=1,
        ),
        "body": ParagraphStyle(
            "GuideBody",
            parent=styles["BodyText"],
            fontName="Helvetica",
            fontSize=10,
            leading=14,
            textColor=colors.HexColor("#111827"),
            spaceAfter=0,
        ),
        "bullet": ParagraphStyle(
            "GuideBullet",
            parent=styles["BodyText"],
            fontName="Helvetica",
            fontSize=10,
            leading=14,
            leftIndent=12,
            firstLineIndent=0,
            bulletIndent=0,
            spaceAfter=0,
            textColor=colors.HexColor("#111827"),
        ),
        "code_block": ParagraphStyle(
            "GuideCode",
            parent=styles["Code"],
            fontName="Courier",
            fontSize=8.5,
            leading=11,
            leftIndent=10,
            rightIndent=10,
            borderPadding=8,
            backColor=colors.HexColor("#F3F4F6"),
            borderColor=colors.HexColor("#D1D5DB"),
            borderWidth=0.5,
            borderRadius=4,
            spaceBefore=4,
            spaceAfter=8,
        ),
    }

    doc = SimpleDocTemplate(
        str(OUTPUT_PATH),
        pagesize=A4,
        rightMargin=2 * cm,
        leftMargin=2 * cm,
        topMargin=2.2 * cm,
        bottomMargin=1.8 * cm,
        title="USV Events Installation Guide",
        author="GitHub Copilot",
        subject="Installation guide for the USV Events platform",
    )

    story = build_story(markdown, custom_styles)
    doc.build(story, onFirstPage=page_decorator, onLaterPages=page_decorator)
    return OUTPUT_PATH


if __name__ == "__main__":
    try:
        pdf_path = generate_pdf()
        print(f"Generated PDF: {pdf_path}")
    except Exception as exc:
        print(f"Failed to generate PDF: {exc}", file=sys.stderr)
        raise SystemExit(1) from exc
