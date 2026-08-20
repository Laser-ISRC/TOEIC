import asyncio
import json
import os
import edge_tts

JSON_INPUT_FILE = 'questions.json'
AUDIO_OUTPUT_DIR = os.path.join('Audio', 'part4')

# Voix de secours par défaut si la clé 'voice' manque dans le JSON
DEFAULT_VOICE = 'en-US-ChristopherNeural'

async def generate_audio_file(text, voice, filepath):
    communicate = edge_tts.Communicate(text, voice)
    await communicate.save(filepath)

async def main():
    os.makedirs(AUDIO_OUTPUT_DIR, exist_ok=True)

    if not os.path.exists(JSON_INPUT_FILE):
        print(f"Erreur : Le fichier {JSON_INPUT_FILE} n'existe pas.")
        return

    with open(JSON_INPUT_FILE, 'r', encoding='utf-8') as f:
        quizzes = json.load(f)

    updated_count = 0

    for quiz_idx, quiz in enumerate(quizzes):
        quiz_id = quiz.get("index", quiz_idx + 1)
        part4_sets = quiz.get("part4", [])

        if not part4_sets:
            continue

        print(f"\n--- Traitement Quiz #{quiz_id} (Part 4) ---")

        for set_idx, talk_set in enumerate(part4_sets):
            # Récupération du texte
            raw_script = talk_set.get("audioScript") or talk_set.get("transcript")
            if isinstance(raw_script, list):
                script_text = " ".join([line.get("text", "") if isinstance(line, dict) else str(line) for line in raw_script])
            else:
                script_text = raw_script or ""

            if not script_text.strip():
                print(f"  [Set {set_idx + 1}] Aucun texte trouvé. Ignoré.")
                continue

            # Lecture de la voix directement depuis le JSON
            voice_to_use = talk_set.get("voice", DEFAULT_VOICE)

            # Détermination du fichier et du chemin de sortie
            filename = f"quiz_{quiz_id}_part4_{set_idx + 1}.mp3"
            filepath = os.path.join(AUDIO_OUTPUT_DIR, filename)

            print(f"  [Set {set_idx + 1}] Génération ({voice_to_use}) -> {filename}...")
            try:
                await generate_audio_file(script_text, voice_to_use, filepath)
                
                # Alignement sur ton format d'URL
                talk_set["outputFile"] = filename
                talk_set["audioUrl"] = f"Audio/part4/{filename}"
                updated_count += 1
            except Exception as e:
                print(f"  [Erreur] {e}")

    with open(JSON_INPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(quizzes, f, ensure_ascii=False, indent=2)

    print(f"\nTerminé ! {updated_count} fichier(s) audio généré(s) avec leurs voix respectives.")

if __name__ == "__main__":
    asyncio.run(main())