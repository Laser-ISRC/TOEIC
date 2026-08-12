import asyncio
import json
import os
import edge_tts


def build_ssml_text(transcript):
    """Construit un texte SSML avec des pauses de 1,5 seconde entre la question et les options."""
    q = transcript["question"]
    opts = transcript["options"]

    return (
        f"{q} ... ..."
        f"Option A. {opts[0]} .."
        f"Option B. {opts[1]} .." 
        f"Option C. {opts[2]}"
    )


async def generate_single_audio(item):
    """Génère l'audio pour une question spécifique."""
    part2_data = item["part2"][0]
    output_file = part2_data["outputFile"]
    voice = part2_data["voice"]
    transcript = part2_data["transcript"]

    # Création du texte avec pauses
    text_ssml = build_ssml_text(transcript)

    # Assure que le dossier de sortie existe (ex: 'Audio/')
    audio_dir = os.path.dirname(part2_data["audioUrl"])
    if audio_dir and not os.path.exists(audio_dir):
        os.makedirs(audio_dir, exist_ok=True)

    # Le chemin final où enregistrer le fichier
    target_path = os.path.join(
        audio_dir, output_file) if audio_dir else output_file

    print(
        f"Génération de {target_path} | Voix : {voice} ({part2_data['accent']})"
    )

    # edge-tts gère le SSML natif
    try:
        communicate = edge_tts.Communicate(text_ssml, voice)
        await communicate.save(target_path)
    except edge_tts.exceptions.NoAudioReceived:
        # Fallback sur une voix US ultra-stable si la voix choisie échoue
        fallback_voice = "en-US-GuyNeural"
        print(
            f"⚠️ Échec avec {voice}. Tentative avec la voix de repli : {fallback_voice}..."
        )
        communicate = edge_tts.Communicate(text_ssml, fallback_voice)
        await communicate.save(target_path)


async def main():
    # 1. Charger ton fichier JSON (nommé ici questions.json)
    with open("questions.json", "r", encoding="utf-8") as f:
        data = json.load(f)

    # 2. Générer tous les audios de manière séquentielle
    for item in data:
        await generate_single_audio(item)
        #await asyncio.sleep(2)

    print("\nTous les fichiers audio ont été générés avec succès !")


if __name__ == "__main__":
    asyncio.run(main())