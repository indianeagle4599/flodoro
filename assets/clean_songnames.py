import os, shutil

DIR = "C:/Users/hites/Desktop/pomodoro_app/assets/_music"
NEW_DIR = "C:/Users/hites/Desktop/pomodoro_app/assets/music"
playlists = os.listdir(DIR)
for playlist in playlists:
    cur_playlist_path = os.path.join(DIR, playlist)
    new_playlist_path = os.path.join(NEW_DIR, playlist)
    os.makedirs(new_playlist_path, exist_ok=True)
    songs = os.listdir(cur_playlist_path)
    for song in songs:
        cur_song_path = os.path.join(cur_playlist_path, song)
        new_song = ".".join(song.split(".")[1:])
        new_song_path = os.path.join(new_playlist_path, new_song)
        shutil.copy(cur_song_path, new_song_path)
