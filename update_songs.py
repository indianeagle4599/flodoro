import os
import json

# Base URL prefix where the audio files are hosted (adjust as needed)
BASE_URL = "assets/music"  # can be a relative path or full URL
AUDIO_DIR = "assets/music"  # local path to scan


def pretty_name(filename):
    name, _ = os.path.splitext(filename)
    parts = name.replace("_", " ").replace("-", " ").split()
    return " ".join(word.capitalize() for word in parts)


def generate_manifest(audio_dir=AUDIO_DIR, base_url=BASE_URL):
    audioSources = {}
    audioLibrary = {}

    if not os.path.exists(audio_dir):
        print(f"Error: Directory '{audio_dir}' does not exist.")
        return {}

    for playlist in os.listdir(audio_dir):
        playlist_path = os.path.join(audio_dir, playlist)
        if os.path.isdir(playlist_path):
            tracks = []
            for file in os.listdir(playlist_path):
                if file.lower().endswith((".mp3", ".wav", ".ogg", ".m4a")):
                    track_id = os.path.splitext(file)[0]
                    # Construct URL relative to base_url
                    track_url = f"{base_url}/{playlist}/{file}"
                    audioSources[track_id] = track_url
                    tracks.append({"id": track_id, "name": pretty_name(file)})
            tracks.sort(key=lambda t: t["name"])
            audioLibrary[playlist] = tracks

    return {"audioSources": audioSources, "audioLibrary": audioLibrary}


def main():
    manifest = generate_manifest()

    # Write JavaScript for the front‑end  ▼▼▼
    js_payload = "const audioManifest = " + json.dumps(manifest, indent=2) + ";"

    with open("audioManifest.js", "w", encoding="utf-8") as f:
        f.write(js_payload)

    print("JavaScript manifest saved to 'audioManifest.js'")


if __name__ == "__main__":
    main()
