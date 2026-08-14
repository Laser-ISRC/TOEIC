import asyncio
import edge_tts

# Script du dialogue TOEIC Part 3
dialogue = [
    {"speaker": "A", "voice": "en-US-GuyNeural", "text": "Hi Jane, did you receive the updated budget report for the new project?"},
    {"speaker": "B", "voice": "en-US-AriaNeural", "text": "Yes, I reviewed it this morning. We need to cut down on marketing expenses."},
    {"speaker": "A", "voice": "en-US-GuyNeural", "text": "I agree. I'll schedule a meeting with the team to discuss the adjustments."}
]

async def generate_dialogue():
    combined_audio = b""
    
    for i, line in enumerate(dialogue):
        print(f"Génération de la réplique {i+1} ({line['speaker']})...")
        communicate = edge_tts.Communicate(line["text"], line["voice"])
        
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                combined_audio += chunk["data"]

    with open("toeic_part3_test.mp3", "wb") as f:
        f.write(combined_audio)
    
    print("\nFichier 'toeic_part3_test.mp3' généré avec succès !")

if __name__ == "__main__":
    asyncio.run(generate_dialogue())