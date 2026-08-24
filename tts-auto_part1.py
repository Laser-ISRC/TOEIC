import asyncio
import json
import os
import edge_tts


def format_script_for_tts(script_text):
    """Insère des pauses entre les options."""
    return (
        script_text.replace("(A)", "Option A.")
        .replace("(B)", " .. Option B.")
        .replace("(C)", " .. Option C.")
        .replace("(D)", " .. Option D.")
    )


async def generate_part1_audio(p1_item):
    """Extraction directe de l'audioScript et génération Edge-TTS."""
    # Récupération souple de la clé audioScript (au cas où il y a un espace masqué)
    script = None
    for k, v in p1_item.items():
        if k.strip().lower() == "audioscript":
            script = v
            break

    target_path = p1_item.get("audioUrl", "Audio/part1/quiz_1_part1.mp3")
    voice = p1_item.get("voice", "en-US-ChristopherNeural")

    if not script:
        print(
            f"❌ Clé 'audioScript' absente dans l'objet Part 1 (ID: {p1_item.get('id')})"
        )
        return

    # Force la création du dossier Audio/part1/
    audio_dir = os.path.dirname(target_path)
    if audio_dir:
        os.makedirs(audio_dir, exist_ok=True)

    text_to_speak = format_script_for_tts(script)
    print(f"🎙️ Génération de : {target_path} ...")

    try:
        communicate = edge_tts.Communicate(text_to_speak, voice)
        await communicate.save(target_path)
        print(f"✅ Fichier créé : {target_path}")
    except Exception as e:
        print(f"❌ Erreur lors de l'enregistrement Edge-TTS : {e}")


async def main():
    json_path = "questions.json"

    if not os.path.exists(json_path):
        print(f"❌ Fichier '{json_path}' introuvable.")
        return

    # Chargement avec utf-8-sig pour virer d'éventuels caractères invisibles BOM
    with open(json_path, "r", encoding="utf-8-sig") as f:
        data = json.load(f)

    if isinstance(data, dict):
        data = [data]

    total_found = 0

    # Recherche directe et forcée de la clé 'part1'
    for quiz in data:
        part1_items = None
        for key in quiz.keys():
            if key.strip().lower() == "part1":
                part1_items = quiz[key]
                break

        if part1_items and isinstance(part1_items, list):
            for p1 in part1_items:
                await generate_part1_audio(p1)
                total_found += 1

    if total_found == 0:
        print("\n🔎 DEBUG : Structure détectée dans le premier élément du JSON :")
        print(f"Clés trouvées : {list(data[0].keys()) if data else 'JSON vide'}")


if __name__ == "__main__":
    asyncio.run(main())