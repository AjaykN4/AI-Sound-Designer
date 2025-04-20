from openai import OpenAI
import sounddevice as sd
import soundfile as sf
import numpy as np
import tempfile
import os

class SoundDesignAssistant:
    def __init__(self):
        # Initialize OpenAI client
        self.client = OpenAI(api_key="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")
        
        # Audio settings
        self.sample_rate = 44100
        self.duration = 5  # seconds
        
        # Conversation history
        self.conversation = [
            {"role": "system", "content": """You are Sonic, an expert sound design assistant. 
            Your role is to:
            1. Provide advice on sound design techniques and best practices
            2. Suggest sound effects and audio processing methods
            3. Help with audio mixing and mastering tips
            4. Recommend tools and software for different sound design tasks
            5. Explain audio concepts and terminology
            6. Assist with sound synthesis and sampling techniques"""}
        ]

    def record_audio(self):
        print("\nRecording... (Press Ctrl+C to stop)")
        recording = sd.rec(int(self.duration * self.sample_rate), 
                         samplerate=self.sample_rate, 
                         channels=1)
        sd.wait()
        return recording

    def save_audio(self, recording, filename):
        sf.write(filename, recording, self.sample_rate)

    def transcribe_audio(self, audio_file):
        with open(audio_file, "rb") as file:
            transcript = self.client.audio.transcriptions.create(
                model="whisper-1",
                file=file
            )
        return transcript.text

    def generate_response(self, text):
        self.conversation.append({"role": "user", "content": text})
        
        response = self.client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=self.conversation,
            temperature=0.7,
            max_tokens=150
        )
        
        ai_response = response.choices[0].message.content.strip()
        self.conversation.append({"role": "assistant", "content": ai_response})
        return ai_response

    def speak_response(self, text):
        response = self.client.audio.speech.create(
            model="tts-1",
            voice="alloy",
            input=text
        )
        
        # Save to temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.mp3') as temp_file:
            response.stream_to_file(temp_file.name)
            return temp_file.name

def main():
    try:
        assistant = SoundDesignAssistant()
        print("Sound Design Assistant initialized. Press Ctrl+C to exit.")
        
        while True:
            # Record audio
            recording = assistant.record_audio()
            
            # Save to temporary file
            with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as temp_file:
                assistant.save_audio(recording, temp_file.name)
                
                # Transcribe
                transcript = assistant.transcribe_audio(temp_file.name)
                print(f"\nYou said: {transcript}")
                
                # Generate response
                response = assistant.generate_response(transcript)
                print(f"\nAssistant: {response}")
                
                # Speak response
                audio_file = assistant.speak_response(response)
                print("\nPlaying response...")
                
                # Clean up
                os.unlink(temp_file.name)
                os.unlink(audio_file)
                
    except KeyboardInterrupt:
        print("\nGoodbye!")
    except Exception as e:
        print(f"An error occurred: {str(e)}")

if __name__ == "__main__":
    main()

        





    



    





