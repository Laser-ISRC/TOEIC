import asyncio
import json
import os
import edge_tts

JSON_FILE = "questions.json"
DEFAULT_AUDIO_DIR = "Audio/part4/"

# Voix neutres et naturelles pour la Part 4 (Short Talks)
DEFAULT_VOICE = "en-US-ChristopherNeural"

async def generate_audio_for_talk(quiz_id, talk_item, talk_index):
    # Gestion des identifiants et des noms de fichiers
    talk_id = talk_item.get("id", f"p4-talk-{quiz_id}-{talk_index}")
    
    # Récupération du script (supporte audioScript ou text)
    script_text = talk_item.get("audioScript") or talk_item.get("text", "")
    
    # Voix spécifique au monologue ou voix par défaut
    voice = talk_item.get("voice", DEFAULT_VOICE)

    # Récupération du nom de fichier destination
    output_file = talk_item.get("outputFile")
    if not output_file and "audioUrl" in talk_item:
        output_file = os.path.basename(talk_item["audioUrl"])
    if not output_file:
        output_file = f"quiz_{quiz_id}_part4_{talk_index}.mp3"

    file_path = os.path.join(DEFAULT_AUDIO_DIR, output_file)

    if not script_text:
        print(f"[-] Aucun texte trouvé pour : {talk_id}")
        return

    print(f"\n[+] Génération audio Part 4 : {talk_id}")
    print(f"    - Voix : {voice}")
    print(f"    - Extrait : {script_text[:60]}...")

    communicate = edge_tts.Communicate(script_text, voice)
    
    # Création du dossier si nécessaire
    os.makedirs(os.path.dirname(file_path), exist_ok=True)

    # Sauvegarde directe du fichier audio
    await communicate.save(file_path)

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

    total_talks = 0

    # Parcourt les quiz du tableau
    for entry in data:
        quiz_id = entry.get("quizId", "unknown")
        part4_talks = entry.get("part4", [])
        
        for idx, talk_item in enumerate(part4_talks, start=1):
            await generate_audio_for_talk(quiz_id, talk_item, idx)
            total_talks += 1

    if total_talks == 0:
        print("[-] Aucune section 'part4' trouvée dans le fichier JSON.")
    else:
        print(f"\n[🎉] Génération terminée avec succès pour {total_talks} monologue(s) Part 4 !")

if __name__ == "__main__":
    asyncio.run(main())