import asyncio
import edge_tts

# Exemple typique de Part 2
TEXT_TO_SPEAK = """
Where is the marketing meeting being held?
Option A. On the third floor.
Option B. Next Tuesday at two o'clock.
Option C. Yes, I'll be attending.
"""

# Voix australienne pour tester
VOICE = "en-AU-WilliamNeural" 
OUTPUT_FILE = "part2_sample.mp3"

async def main():
    communicate = edge_tts.Communicate(TEXT_TO_SPEAK, VOICE)
    await communicate.save(OUTPUT_FILE)
    print(f"Fichier audio généré avec succès : {OUTPUT_FILE}")

if __name__ == "__main__":
    asyncio.run(main())