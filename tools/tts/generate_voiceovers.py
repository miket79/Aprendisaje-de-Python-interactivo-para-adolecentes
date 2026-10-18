#!/usr/bin/env python3
"""Generate the app's voice-over clips with Kokoro TTS (runs locally, free).

Reads every lesson in src/content/lessons/*.json and writes one MP3 per step
and language to public/audio/<lang>/<lesson-id>/<step-id>.mp3.

Unchanged lines are skipped (a manifest stores a hash of text + voice), so
re-running after editing one sentence only re-records that sentence.

Usage:
  python tools/tts/generate_voiceovers.py --download-models   # once (~120 MB)
  python tools/tts/generate_voiceovers.py                     # all lessons, all languages
  python tools/tts/generate_voiceovers.py --lesson day-01 --lang es --force
  python tools/tts/generate_voiceovers.py --say "Hola" --lang es   # quick voice test
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
TOOL_DIR = Path(__file__).resolve().parent
LESSONS_DIR = ROOT / "src" / "content" / "lessons"
AUDIO_DIR = ROOT / "public" / "audio"
MODELS_DIR = TOOL_DIR / "models"
MANIFEST = AUDIO_DIR / "manifest.json"

RELEASE = "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0"
MODEL_FILE = "kokoro-v1.0.int8.onnx"  # 88 MB, good quality on CPU. f32 version: kokoro-v1.0.onnx
VOICES_FILE = "voices-v1.0.bin"


def strip_markdown(md: str) -> str:
    """Same rules as stripMarkdown() in src/audio/useVoiceOver.ts."""
    text = re.sub(r"```[\s\S]*?```", " ", md)
    text = re.sub(r"`([^`]*)`", r"\1", text)
    text = re.sub(r"\*\*([^*]+)\*\*", r"\1", text)
    text = re.sub(r"\*([^*]+)\*", r"\1", text)
    text = re.sub(r"^\s*(?:[-*]|\d+\.)\s+", "", text, flags=re.M)
    return re.sub(r"\s+", " ", text).strip()


def narration(step: dict, lang: str) -> str:
    voice = step.get("voice") or {}
    return voice.get(lang) or strip_markdown(step["body"][lang])


def download_models() -> None:
    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    for name in (MODEL_FILE, VOICES_FILE):
        target = MODELS_DIR / name
        if target.exists() and target.stat().st_size > 1_000_000:
            print(f"✓ {name} already downloaded")
            continue
        print(f"↓ downloading {name} ...")
        tmp = target.with_suffix(".part")
        urllib.request.urlretrieve(f"{RELEASE}/{name}", tmp)
        tmp.rename(target)
        print(f"✓ {name} ({target.stat().st_size / 1e6:.0f} MB)")


def load_tts():
    model, voices = MODELS_DIR / MODEL_FILE, MODELS_DIR / VOICES_FILE
    if not model.exists() or not voices.exists():
        sys.exit("Models not found. Run first:  python tools/tts/generate_voiceovers.py --download-models")
    from kokoro_onnx import Kokoro  # imported late so --help works without the venv

    return Kokoro(str(model), str(voices))


def synthesize(tts, text: str, cfg: dict, out: Path) -> float:
    import soundfile as sf

    samples, sample_rate = tts.create(text, voice=cfg["voice"], speed=cfg["speed"], lang=cfg["lang"])
    out.parent.mkdir(parents=True, exist_ok=True)
    sf.write(out, samples, sample_rate, format="MP3")
    return len(samples) / sample_rate


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--download-models", action="store_true", help="download the Kokoro model files and exit")
    parser.add_argument("--lesson", action="append", help="only this lesson id (repeatable), e.g. day-01")
    parser.add_argument("--lang", action="append", help="only this language (repeatable): en, es")
    parser.add_argument("--force", action="store_true", help="re-record even if the text didn't change")
    parser.add_argument("--dry-run", action="store_true", help="list what would be recorded")
    parser.add_argument("--say", help="record one test sentence to public/audio/_test-<lang>.mp3")
    args = parser.parse_args()

    if args.download_models:
        download_models()
        return

    voices = json.loads((TOOL_DIR / "voices.json").read_text(encoding="utf-8"))
    langs = args.lang or list(voices)

    if args.say:
        tts = load_tts()
        for lang in langs:
            out = AUDIO_DIR / f"_test-{lang}.mp3"
            secs = synthesize(tts, args.say, voices[lang], out)
            print(f"✓ {out.relative_to(ROOT)} ({secs:.1f}s)")
        return

    manifest = json.loads(MANIFEST.read_text(encoding="utf-8")) if MANIFEST.exists() else {}
    jobs = []
    for path in sorted(LESSONS_DIR.glob("*.json")):
        lesson = json.loads(path.read_text(encoding="utf-8"))
        if args.lesson and lesson["id"] not in args.lesson:
            continue
        for step in lesson["steps"]:
            for lang in langs:
                text = narration(step, lang)
                cfg = voices[lang]
                key = f"{lang}/{lesson['id']}/{step['id']}"
                digest = hashlib.sha256(json.dumps([text, cfg], ensure_ascii=False).encode()).hexdigest()[:16]
                out = AUDIO_DIR / f"{key}.mp3"
                if not args.force and manifest.get(key) == digest and out.exists():
                    continue
                jobs.append((key, text, cfg, out, digest))

    if not jobs:
        print("Everything is up to date. (Use --force to re-record.)")
        return
    if args.dry_run:
        for key, text, *_ in jobs:
            print(f"{key}: {text[:70]}{'…' if len(text) > 70 else ''}")
        print(f"{len(jobs)} clip(s) would be recorded.")
        return

    tts = load_tts()
    total = 0.0
    for i, (key, text, cfg, out, digest) in enumerate(jobs, 1):
        secs = synthesize(tts, text, cfg, out)
        total += secs
        manifest[key] = digest
        print(f"[{i}/{len(jobs)}] ✓ {key}.mp3 ({secs:.1f}s, voice {cfg['voice']})")
        MANIFEST.write_text(json.dumps(manifest, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(f"Done: {len(jobs)} clip(s), {total:.0f}s of audio.")


if __name__ == "__main__":
    main()
