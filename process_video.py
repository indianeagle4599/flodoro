#!/usr/bin/env python3
"""
process_video.py
================

This utility script demonstrates how one might download a high‑quality video
from YouTube using ``yt‑dlp`` and then generate a loopable segment for use
within the Pomodoro application as a calming background. The script relies
on two external tools: ``yt-dlp`` for downloading and ``ffmpeg`` for
trimming/processing. Both must be installed and available on your system's
PATH for the script to function correctly.

The environment provided here does not allow outgoing network access, so
actual downloading cannot be tested. However, the logic is presented to
allow you to run this script locally on your machine where network access
and the required dependencies are present.

Usage::

    python process_video.py --url "https://www.youtube.com/watch?v=..." --output-dir ./processed --trim 120

This will download the specified video at the best available quality up to
4K, extract the first ``trim`` seconds (default 60 seconds), and save it
as ``loop.mp4`` in the given output directory. You can then set the
``wallpaper-select`` option in the Pomodoro app to use this video file
instead of a static image (further integration required in app.js).

Limitations:
  * Determining an ideal loop point automatically is a complex problem.
    Here we simply trim the first N seconds. For a seamless loop you may
    experiment with different trim lengths and choose a segment where the
    beginning and end are visually and audibly similar.
  * ``yt-dlp`` options select the best video/audio streams up to 2160p.
    Modify the format string if you wish to restrict resolution further.
  * If the video contains copyrighted material, ensure your usage
    complies with YouTube's terms of service and local regulations.
"""

import argparse
import os
import subprocess
import sys


def run(cmd, **kwargs):
    """Execute a subprocess and raise if it fails."""
    print(f"Running: {' '.join(cmd)}")
    result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, **kwargs)
    if result.returncode != 0:
        print(result.stdout)
        raise RuntimeError(f"Command failed: {' '.join(cmd)}")
    return result


def download_video(url: str, output_path: str) -> str:
    """Download the video at ``url`` using yt-dlp and return the path to the downloaded file."""
    base, ext = os.path.splitext(output_path)
    # Use yt-dlp to download the best video up to 4K and merge audio
    cmd = [
        "yt-dlp",
        "-f",
        "bestvideo[height<=2160]+bestaudio/best",
        "--merge-output-format",
        "mp4",
        "-o",
        output_path,
        url,
    ]
    run(cmd)
    return output_path


def trim_video(input_path: str, output_path: str, trim_seconds: int) -> None:
    """Trim the first ``trim_seconds`` of ``input_path`` into ``output_path`` using ffmpeg."""
    cmd = [
        "ffmpeg",
        "-y",  # Overwrite output
        "-i",
        input_path,
        "-t",
        str(trim_seconds),
        "-c",
        "copy",
        output_path,
    ]
    run(cmd)


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description="Download a YouTube video and trim it to create a loopable segment.")
    parser.add_argument("--url", required=True, help="YouTube URL to download")
    parser.add_argument("--output-dir", default=".", help="Directory to store the processed video")
    parser.add_argument("--trim", type=int, default=60, help="Length of the segment in seconds")
    args = parser.parse_args(argv)

    os.makedirs(args.output_dir, exist_ok=True)
    temp_video_path = os.path.join(args.output_dir, "downloaded.mp4")
    loop_video_path = os.path.join(args.output_dir, "loop.mp4")

    try:
        download_video(args.url, temp_video_path)
        trim_video(temp_video_path, loop_video_path, args.trim)
        print(f"Loopable segment saved to {loop_video_path}")
        # Cleanup the original download to conserve space
        os.remove(temp_video_path)
    except Exception as e:
        print(f"Error: {e}")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())