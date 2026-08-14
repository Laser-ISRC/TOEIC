import asyncio
import json
import os
import edge_tts

JSON_FILE = "questions.json"
DEFAULT_AUDIO_DIR = "Audio/part3/"

async def generate_audio_for_set(set_item):
    set_id = set_item.get("id", "unknown_set")
    transcript = set_item.get("transcript", [])
    
    # Récupération du nom de fichier
    output_file = set_item.get("outputFile")
    if not output_file and "audioUrl" in set_item:
        output_file = os.path.basename(set_item["audioUrl"])
    if not output_file:
        output_file = f"{set_id}.mp3"

    file_path = os.path.join(DEFAULT_AUDIO_DIR, output_file)

    if not transcript:
        print(f"[-] Aucun transcript trouvé pour : {set_id}")
        return

    combined_audio = b""
    print(f"\n[+] Génération audio dialogue : {set_id} ({len(transcript)} répliques)")

    for idx, line in enumerate(transcript, start=1):
        text = line.get("text", "")
        voice = line.get("voice", "en-US-GuyNeural")
        speaker = line.get("speaker", f"Speaker {idx}")

        print(f"    - [{speaker} | {voice}]: {text[:45]}...")

        communicate = edge_tts.Communicate(text, voice)
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                combined_audio += chunk["data"]

    # Création du dossier si nécessaire
    os.makedirs(os.path.dirname(file_path), exist_ok=True)

    with open(file_path, "wb") as f:
        f.write(combined_audio)

    print(f"[✓] Audio généré avec succès -> {file_path}")

async def main():
    if not os.path.exists(JSON_FILE):
        print(f"[!] Fichier '{JSON_FILE}' introuvable.")
        return

    with open(JSON_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)

    if not isinstance(data, list):
        print("[!] Le fichier JSON doit contenir un tableau '[]' à la racine.")
        return

    total_sets = 0
    # Parcourt les objets/sessions du tableau racine
    for entry in data:
        part3_sets = entry.get("part3", [])
        for set_item in part3_sets:
            await generate_audio_for_set(set_item)
            total_sets += 1

    if total_sets == 0:
        print("[-] Aucune section 'part3' trouvée dans les objets du JSON.")
    else:
        print(f"\n[🎉] Génération terminée avec succès pour {total_sets} set(s) Part 3 !")

if __name__ == "__main__":
    asyncio.run(main())